import { AwsProvider } from "@cdktf/provider-aws/lib/provider"
import { S3Backend, TerraformStack } from "cdktf"
import {Construct} from "constructs"
import { Cloudwatch } from "./infrastructure/aws/cloudwatch" 
import { StripeProduct } from "./infrastructure/stripe/product"
import { Cognito } from "./infrastructure/aws/cognito"
import { Dynamodb } from './infrastructure/aws/dynamodb'
import { StripeProvider } from "../../.gen/providers/stripe/provider"

/* Services */
import { AuthenticateService } from "./app/service-authenticate/service"
import { StepFunctions } from "../sharedResources/infrastructure/aws/stepFunctions"
import { Lambda } from "../sharedResources/infrastructure/aws/lambda"
import { LambdaLayers } from "../sharedResources/infrastructure/aws/lambdaLayers"
import { join } from "path"
import { CloudwatchQueryDefinition } from "@cdktf/provider-aws/lib/cloudwatch-query-definition"
import { Iam } from "./infrastructure/aws/iam"
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity"
import { LambdaAuthenticationController } from "./interface/controller-lambda/lambdaAuthenticationController" 
import { Athena } from "./infrastructure/aws/athena"
import { StripeWebhookEndpoint } from './infrastructure/stripe/webhookEndpoint'


export class DataStack extends TerraformStack { 
    private _cognitoResource : any
    private _cloudwatchResource : any
    private _name : any
    private _stripeResource: any ={}
    private _eventBusResource : any = {}
    private _stripeWebhooksValidationEntityResource : any
    private _webhookServiceSnippets: any
    private _cognitoEntity: any
    private _sqsResource: any
    private _resourceType: any
    private _cognitoEntitygoogleRecaptchaEntity:any
    private _stripeWebhookEndpointResource:any
    private _iamResource:any
  
    public get iamResource(){return this._iamResource}
    public get resourceType(){return this._resourceType}
    public get sqsResource(){return this._sqsResource}
    public get stepFunctionSnippets(){return this._webhookServiceSnippets}
    public get name(){return this._name}
    public get cloudwatchResource(){return this._cloudwatchResource}
    public get cognitoResource(){return this._cognitoResource}
    public get stripeResource(){return this._stripeResource}
    public get stripeWebhooksValidationEntityResource(){return this._stripeWebhooksValidationEntityResource}
    public get eventBusResource(){return this._eventBusResource}
    public get cognitoEntity(){return this._cognitoEntity}
    public get cognitoEntitygoogleRecaptchaEntity(){return this._cognitoEntitygoogleRecaptchaEntity}
    public get stripeWebhookEndpointResource(){return this._stripeWebhookEndpointResource}
  
    constructor(scope: Construct, stackName: string, hostedZone:string, sesResource:any, resourceType: string, config:any, defaultRegion:string, logRetentionPeriod:number, backendStateS3BucketName:string, stackPath:string, stripeToken:string, reCaptchaToken:string, freePlanDBKey:string, s3Resource:any) {
      super(scope, stackName);
  
      new S3Backend(this, {
        bucket: backendStateS3BucketName,
        key: stackName,
        region: defaultRegion
      })
  
      /* resources */
      this._name = stackName
      this._resourceType = resourceType
      new StripeProvider (this, "stripe-"+resourceType, {apiToken: stripeToken})
      new AwsProvider(this, "aws", { alias: 'dataStacks', region: defaultRegion });
      const dataCallerIdentity = new DataAwsCallerIdentity(this,"dataCallerIdentity",{})
      const accountId = dataCallerIdentity.accountId
      this._iamResource = new Iam(this, "Iam", accountId, defaultRegion, stackName)
      let lambdaControllers:any
  
      this._stripeResource = new StripeProduct(this, "stripeProduct", config, resourceType)
      this._stripeWebhookEndpointResource = new StripeWebhookEndpoint(this, "stripeWebhooks", config.stripe['webhookEndpointSubdomain-'+resourceType]+'.'+hostedZone, 'https://')
    
      this._cloudwatchResource  = new Cloudwatch(this, "cloudwatch", logRetentionPeriod, stackName)
      new Dynamodb(this, stackName, this._stripeResource.products, config.stripe.SubscriptionPlans, resourceType)
      const lambdaResource = new Lambda(this, stackName, defaultRegion, accountId, this._iamResource.roles['lambdaServiceRole'].arn, "_LambdaTriggers", this._cloudwatchResource)
      const lambdaLayersResource = new LambdaLayers(this, stackName+"-lambdaLayers")
      
      /* stacks/web/data Controllers */
      lambdaControllers = new LambdaAuthenticationController(this, 'lambda-authentication-controller', lambdaResource, join(stackPath,"interface","controller-lambda"), lambdaResource.defaultEnvVars)
      
      this._cognitoResource = new Cognito(this, stackName, hostedZone, config, this._iamResource.roles['cognitoSnsRole'], sesResource.domainIdentity.arn, lambdaControllers["postConfirmationTrigger"], lambdaControllers["preTokenGenerationTrigger"], config.disableNewUsers);
      
      /* stacks/web/data Entities */
      this._cognitoEntity = this._cognitoResource.userPool.id
      let envVars = lambdaResource.defaultEnvVars
      envVars.RECAPTCHA_SITE_SECRET = reCaptchaToken
      this._cognitoEntitygoogleRecaptchaEntity = lambdaResource.CreateLambdaNodeJsFunction("googleRecaptcha", join(stackPath,"entities"), envVars, [lambdaLayersResource.lambdaLayers["google-recaptcha"].arn])
      envVars = lambdaResource.defaultEnvVars

      /* stacks/web/data Services */
      const authenticateService = new AuthenticateService(this, "data-stack-authenticate-step-functions", this._cognitoEntity, stackName, join(stackPath,"app","service-authenticate","stepFunctionDefinitions"), freePlanDBKey)
      new StepFunctions(this, "dataStackStepFunctions", config.sfn.logLevel, stackName, {...authenticateService.stepFunctionDefinitions}, this._iamResource.roles['stepFunctionsServiceRole'].arn, this._cloudwatchResource.stepFunctionLogGroup.arn+":*" , defaultRegion, accountId);
      
      /* logging */
      new CloudwatchQueryDefinition(this, "stepfunction_cloudwatch_query", {
        name: stackName+"-stepFunction-errors",
        logGroupNames: [this._cloudwatchResource.stepFunctionLogGroup.name],
        queryString: `fields @timestamp, @message, @logStream, @log | filter @message like "Error"`
      })
  
      new CloudwatchQueryDefinition(this, "lambda_cloudwatch_query", {
        name: stackName+"-lambda-errors",
        logGroupNames: this._cloudwatchResource.lambdaLogGroupNamesArray(),
        queryString: `fields @timestamp, @message, @logStream, @log | filter @message like "Error"`
      })

      //create athena database for use with Cloudwatch
      const athena = new Athena(this, 'athena');
      const athenaBucketName = 'athena-cloudfront-logs'
      athena.createCloudfrontS3LogDatabase(resourceType+'_athena_cloudfront_logs', s3Resource.s3CloudfrontLoggingBucket.id+"/"+config.s3WebsiteDomainName+"/athena")
      athena.createCloudfrontS3LogTable(athenaBucketName, 'cloudfront-logs',config.s3WebsiteDomainName, 'createCloudfrontLogTable')
    }
  }
  
