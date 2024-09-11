import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf'
import {Construct} from "constructs"
import { AwsProvider } from '@cdktf/provider-aws/lib/provider'
import { Cloudfront } from '../sharedResources/infrastructure/aws/cloudfront'
import { S3 } from "../sharedResources/infrastructure/aws/s3"
import { Route53 } from '../sharedResources/infrastructure/aws/route53'


export class DocumentationStack extends TerraformStack {

    private _config:any
    private _s3WebsiteBucketDomain:string
  
    public get config(){return this._config}
    public get s3WebsiteBucketDomain(){return this._s3WebsiteBucketDomain}


    constructor(
        scope: Construct, 
        stackName: string,
        region: string, 
        config: any, 
        hostingStack: any, 
        backendStateS3BucketName:string, 
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
           
      // hosting, logging, waf section - maybe move to a separate stack
      const cloudfront:Cloudfront = new Cloudfront(this, stackName+"webhook")
      const route53 = new Route53(this, stackName+"-route53CustomDomainName")

  
      //add s3 static webhosting
      const s3 = new S3(this, "s3")
      this._s3WebsiteBucketDomain = s3.CreateWebhostingBucket(config.s3WebsiteDomainName, config.s3WebsiteDomainName+"-bucket")
      
      // you may need to deploy twice when modifying DNS records below since an error will occur on first 
      // deployment due to a delete-record/create-record timing issue.
      cloudfront.newDistribution(
        'staticWebhostingDocumentation', 
        config.s3WebsiteDomainName+"."+this._s3WebsiteBucketDomain, 
        hostingStack.acmResource.certificates["appsyncSslCert"].arn, 
        "s3-bucket-"+config.s3WebsiteDomainName+"."+this._s3WebsiteBucketDomain,
        hostingStack.s3Resource.s3CloudfrontLoggingBucket.bucketDomainName, 
        [config.s3WebsiteDomainName]
      )
      route53.addCustomDomainToCloudfront(config.s3WebsiteDomainName, cloudfront.cloudfrontDistributions['staticWebhostingDocumentation'].domainName, hostingStack.hostedZoneResource.zone.id, cloudfront.cloudfrontDistributions['staticWebhostingDocumentation'].hostedZoneId)
      new TerraformOutput(this, 'acmSslCertArn', { value: hostingStack.acmResource.certificates["appsyncSslCert"].arn})
      //TODO point S3 cloudfront logs to athena database

    } 
  }
