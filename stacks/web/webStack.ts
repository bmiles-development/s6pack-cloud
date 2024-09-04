import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf'
import {Construct} from "constructs"
import { CloudwatchQueryDefinition } from '@cdktf/provider-aws/lib/cloudwatch-query-definition'
import { LambdaLayers } from '../sharedResources/infrastructure/aws/lambdaLayers'
import { Lambda } from '../sharedResources/infrastructure/aws/lambda'
import { StepFunctions } from "../sharedResources/infrastructure/aws/stepFunctions"
import { Cloudfront } from '../sharedResources/infrastructure/aws/cloudfront'
import { StripeProvider } from "../../.gen/providers/stripe/provider"
import { Appsync } from "./infrastructure/aws/appsync"
import { S3 } from "./infrastructure/aws/s3"
import { AwsProvider } from '@cdktf/provider-aws/lib/provider'
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Iam } from './infrastructure/aws/iam'
import { LambdaFunctionUrl } from '@cdktf/provider-aws/lib/lambda-function-url';

/* Services */
import { AccountService } from './app/service-account/service'
import { UserService } from "./app/service-user/service"
import { PlanService } from './app/service-plan/service'

/* Presenters */ 
import { AppSyncGraphqlController } from './interface/controller-appsync/appsyncGraphqlController'
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record'
import { AcmCertificateValidationResource } from './infrastructure/aws/acmCertificateValidationResource'
import { AppsyncDomainNameResource } from '../sharedResources/infrastructure/aws/appsyncDomainNameResource'
import { Route53 } from '../sharedResources/infrastructure/aws/route53'
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission'

export class WebStack extends TerraformStack {

    private _config:any
    private _s3WebsiteBucketDomain:string
    private _appsyncDomainNameResource:any
    private _appsyncResource:any
    private _webhookDomainName:string
  
    public get config(){return this._config}
    public get appsyncDomainNameResource(){return this._appsyncDomainNameResource}
    public get s3WebsiteBucketDomain(){return this._s3WebsiteBucketDomain}
    public get appsyncResource(){return this._appsyncResource}
    public get webhookDomainName(){return this._webhookDomainName}


    constructor(
        scope: Construct, 
        stackName: string,
        region: string, 
        config: any, 
        hostingStack: any, 
        dataStack: any, 
        stripeTrialPeriodInDays:number, 
        stackPath:string, 
        backendStateS3BucketName:string, 
        stripeToken:string, 
        contactUsEmailAddress:string, 
        freePlanDBKey:string,
        cloudFrontLambdaUrlAccessUuid:string
      //  stripeWebhooksIpList:string[] = [] 
    ){
      super(scope, stackName);
      new S3Backend(this, {
        bucket: backendStateS3BucketName,
        key: stackName,
        region: region
      })
  
      /* resources */
      this._config = config
      new AwsProvider(this, "aws", { region: region });
      new StripeProvider (this, "stripe-"+stackName, {apiToken: stripeToken})
      let envVars: any = {}
      const dataCallerIdentity = new DataAwsCallerIdentity(this,"dataCallerIdentity",{})
      const accountId = dataCallerIdentity.accountId
      const awsUsEast1Provider = new AwsProvider(this, "awsUse1", { alias: 'use1',region: 'us-east-1' });  //Hard code a us-east-1 for cloudfront ssl certs (only available in us-east-1)
      const iamResource = new Iam(this, "Iam", accountId, region, stackName)
      const schemaFile = readFileSync(join(stackPath,"interface","controller-appsync","schema.graphql"), 'utf-8')
      const appsyncController = new AppSyncGraphqlController(this, "AppSyncGraphqlController",accountId, region, stackName, join(stackPath,"interface","controller-appsync"))
      const lambdaResource = new Lambda(this, stackName, region, accountId, iamResource.roles['lambdaServiceRole'].arn, "_LambdaStepFunctions", dataStack.cloudwatchResource)
      
      const lambdaLayersResource = new LambdaLayers(this, stackName+"-lambdaLayers")
      const webhookSubdomainName =  "webhook"+config.subdomainName // this must match the stripe webhook endpoint in the dataStackDev stack for  testing endpoints to work

      /* stacks/web/app Entities */
      const cognitoEntity = dataStack.cognitoEntity
      const cognitoEntitygoogleRecaptchaEntity = dataStack.cognitoEntitygoogleRecaptchaEntity
      const lambdaLayersArns = [lambdaLayersResource.lambdaLayers["aws4"].arn]
      envVars = lambdaResource.defaultEnvVars
      envVars.STRIPE_SECRET_KEY = stripeToken
      envVars.TRIAL_PERIOD_IN_DAYS = stripeTrialPeriodInDays
      const stripeApiEntity = lambdaResource.CreateLambdaNodeJsFunction("stripeApi", join(stackPath,"entities"), envVars, [lambdaLayersResource.lambdaLayers["stripe"].arn, lambdaLayersResource.lambdaLayers["moment"].arn])
      const filterUsersToDeactivateFunctionEntity = lambdaResource.CreateLambdaNodeJsFunction("filterUsersToDeactivateFunction", join(stackPath, "app", "serviceComponents"), envVars, lambdaLayersArns)
      const stripeWebhookValidationEntity = lambdaResource.CreateLambdaNodeJsFunction("stripeWebhooksValidation", join(stackPath,"entities"), envVars, [lambdaLayersResource.lambdaLayers["stripe"].arn])

      /* stacks/web/app Service Component Functions */      
      const subtractionFunction = lambdaResource.CreateLambdaNodeJsFunction("subtractionFunction", join(stackPath, "app", "serviceComponents"), envVars, lambdaLayersArns)
      const trialPeriodCalculationFunction = lambdaResource.CreateLambdaNodeJsFunction("trialPeriodCalculationFunction", join(stackPath,"app", "serviceComponents"), lambdaResource.defaultEnvVars)
      const checkCancelDeadlinePassedFunction = lambdaResource.CreateLambdaNodeJsFunction("checkCancelDeadlinePassedFunction", join(stackPath,"app", "serviceComponents"), lambdaResource.defaultEnvVars)
      const selectPlanIdByProcessorPlanIdFunction = lambdaResource.CreateLambdaNodeJsFunction("selectPlanIdByProcessorPlanIdFunction", join(stackPath,"app", "serviceComponents"), lambdaResource.defaultEnvVars)

      /* stacks/web/app Services */
      const accountService = new AccountService(this, "account_service", cognitoEntity, contactUsEmailAddress, cognitoEntitygoogleRecaptchaEntity,  dataStack.name, join(stackPath,"app","service-account", "stepFunctionDefinitions"), stripeApiEntity, freePlanDBKey, String(stripeTrialPeriodInDays), trialPeriodCalculationFunction, filterUsersToDeactivateFunctionEntity, subtractionFunction, checkCancelDeadlinePassedFunction, stripeWebhookValidationEntity)
      const userService = new UserService(this, "user_service", cognitoEntity, dataStack.name, join(stackPath,"app","service-user", "stepFunctionDefinitions"))
      const planService = new PlanService(this, "plan_service", dataStack.name, freePlanDBKey, stripeApiEntity, join(stackPath,"app","service-plan", "stepFunctionDefinitions"), String(stripeTrialPeriodInDays), trialPeriodCalculationFunction, selectPlanIdByProcessorPlanIdFunction)
      
      /* stacks/web/app Controllers */
      new StepFunctions(this, "webStackStepFunctions", config.sfn.logLevel, stackName, {...userService.stepFunctionDefinitions, ...planService.stepFunctionDefinitions, ...accountService.stepFunctionDefinitions}, iamResource.roles['stepFunctionsServiceRole'].arn, dataStack.cloudwatchResource.stepFunctionLogGroup.arn+":*" , region, accountId);
      this._appsyncResource = new Appsync( this, "appsync", region, config, schemaFile, appsyncController.graphqlResolvers, iamResource.roles['appsyncServiceRole'].arn, dataStack.cognitoResource.userPool.id, dataStack.cloudwatchResource, stackName);
      iamResource.addAppsyncIdentityPoolRolesAttachment(stackName, region, accountId, dataStack.cognitoResource.identityPool.id, this._appsyncResource.graphqlApi.id);
  
      /* stacks/web/app Gateways - stripe webhook lambda url and cloudfront to appsync. */  
      
      iamResource.addAppsyncAccessPolicyToLambdaRole(stackName, region, accountId, this._appsyncResource.graphqlApi.id, ['cancelPlanPeriodEndedWebhook']);
      envVars =  lambdaResource.defaultEnvVars
      envVars.GRAPHQL_API_ENDPOINT = 'https://'+config.appsyncDomainName+'/graphql';
      envVars.LAMBDA_URL_ACCESS_UUID = cloudFrontLambdaUrlAccessUuid
      const queryAppsyncGatewayFunctionArn = lambdaResource.CreateLambdaNodeJsFunction("queryAppsyncGatewayFunction", join(stackPath,"interface", "gateway-lambdaUrl"), envVars, lambdaLayersArns, iamResource.roles['webhookGatewayLambda'].arn)
      const cloudfrontViewerRequestIpAllowFunctionArn = lambdaResource.CreateEdgeLambdaNodeJsFunction(awsUsEast1Provider, "cloudfrontViewerRequestIpAllowFunction", join(stackPath,"interface", "gateway-lambdaUrl"), [], iamResource.roles['lambdaServiceRole'].arn)

      const gatewayFunctionUrlResource = new LambdaFunctionUrl(this, "stripeWebhookGatewayLambdaFunctionUrl",{functionName : queryAppsyncGatewayFunctionArn, authorizationType : "NONE"}) 
      const webhookFunctionUrlDomain = gatewayFunctionUrlResource.urlId+".lambda-url."+region+".on.aws"
      
      // hosting, logging, waf section - maybe move to a separate stack
      const cloudfront:Cloudfront = new Cloudfront(this, stackName+"webhook")
      this._webhookDomainName = webhookSubdomainName+"."+hostingStack.hostedZoneResource.hostedZone

      const webhookDistribution = cloudfront.newLambdaURLDistribution(
        "webhookUrl", 
        webhookFunctionUrlDomain,  
        hostingStack.acmResource.certificates["appsyncSslCert"].arn, 
        gatewayFunctionUrlResource.urlId, 
        hostingStack.s3Resource.s3CloudfrontLoggingBucket.bucketDomainName, 
        [this._webhookDomainName],
        cloudFrontLambdaUrlAccessUuid,
        cloudfrontViewerRequestIpAllowFunctionArn
      )
      
      new LambdaPermission(this, "webhookCloudfrontLambdaUrlPermission",{
        action: "lambda:InvokeFunction",
        functionName: lambdaResource.lambdas["stripeWebhooksValidation"].arn,
        principal: "cloudfront.amazonaws.com",
        sourceArn: webhookDistribution.arn
      })

      //Note: OAC for lambda from cloudfront is limited to GET requests only: https://community.aws/content/2fuBTcoVg7nnRIVLnqjIsIC8LAi/enhancing-security-for-lambda-function-urls?lang=en
      envVars
      new Route53Record(this, webhookSubdomainName+"-lambdaWebhook-cloudfront-domain", {zoneId: hostingStack.hostedZoneResource.zone.id, name: this._webhookDomainName, type: "CNAME", ttl: 60, records: [cloudfront.cloudfrontDistributions["webhookUrl"].domainName]})
    
      new AcmCertificateValidationResource( this, "acmCertificateValidation", hostingStack.acmResource, hostingStack.hostedZoneResource.sslRecordsBatches['appsyncSslValidationRecords'], awsUsEast1Provider)
      this._appsyncDomainNameResource = new AppsyncDomainNameResource(this, stackName+"-appsyncDomainName")
      this._appsyncDomainNameResource.addAppsyncDomainName(config.appsyncDomainName, hostingStack.acmResource.certificates["appsyncSslCert"].arn, stackName)
      this._appsyncDomainNameResource.addAppsyncDomainNameApiAssociation(this._appsyncResource.graphqlApi.id, stackName)
      
      const route53 = new Route53(this, stackName+"-route53CustomDomainNames")
      route53.addAppsyncCustomDoamain( config.appsyncDomainName, this._appsyncDomainNameResource.appsyncDomainNameResource.appsyncDomainName, hostingStack.hostedZoneResource.zone.id, this._appsyncDomainNameResource.appsyncDomainNameResource.hostedZoneId)
      new TerraformOutput(this, 'appsyncDomainName', { value: this._appsyncDomainNameResource.appsyncDomainNameResource.appsyncDomainName })
      new TerraformOutput(this, 'appsyncDomainZoneId', { value: this._appsyncDomainNameResource.appsyncDomainNameResource.hostedZoneId })
     //logging
      new CloudwatchQueryDefinition(this, "step_functions_cloudwatch_query", {
        name: stackName+"-step-function-errors",
        logGroupNames: dataStack.cloudwatchResource.stepFunctionsLogGroupNamesArray(),
        queryString: `fields @timestamp, @message, @logStream, @log | filter @message like "Error"`
      })
  
      new CloudwatchQueryDefinition(this, "appsync_cloudwatch_query", {
        name: stackName+"-appsync-errors",
        logGroupNames: dataStack.cloudwatchResource.appsyncLogGroupNamesArray(),
        queryString: `fields @timestamp, @message, @logStream, @log | filter @message like "Error"`
      })
  
      //add s3 static webhosting
      const s3 = new S3(this, "s3")
      this._s3WebsiteBucketDomain = s3.CreateWebhostingBucket(config.s3WebsiteDomainName, "-bucket")
      
      // you may need to deploy twice when modifying DNS records below since an error will occur on first 
      // deployment due to a delete-record/create-record timing issue.
      cloudfront.newDistribution(
        'staticWebhosting', 
        config.s3WebsiteDomainName+"."+this._s3WebsiteBucketDomain, 
        hostingStack.acmResource.certificates["appsyncSslCert"].arn, 
        "s3-bucket-"+config.s3WebsiteDomainName+"."+this._s3WebsiteBucketDomain,
        hostingStack.s3Resource.s3CloudfrontLoggingBucket.bucketDomainName, 
        [config.s3WebsiteDomainName]
      )
      route53.addS3CloudfrontDomainRoute53Record( config.s3WebsiteDomainName, cloudfront.cloudfrontDistributions['staticWebhosting'].domainName, hostingStack.hostedZoneResource.zone.id, cloudfront.cloudfrontDistributions['staticWebhosting'].hostedZoneId)
      new TerraformOutput(this, 'acmSslCertArn', { value: hostingStack.acmResource.certificates["appsyncSslCert"].arn})
      //TODO point S3 cloudfront logs to athena database

    } 
  }
