import {Construct} from "constructs"
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity'
import { AwsProvider } from '@cdktf/provider-aws/lib/provider'
import { Ssm } from './infrastructure/aws/ssm'
import { Iam } from "./infrastructure/aws/iam"
import { Ses } from "./infrastructure/aws/ses"
import { Acm } from "./infrastructure/aws/acm"
import { Route53HostedZone } from "./infrastructure/aws/route53"
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf'
import { S3 } from './infrastructure/aws/s3'

export class HostingStack extends TerraformStack {
    private _hostedZoneResource : any
    private _sesResource : any
    private _ssmResource : any
    private _acmResource : any
    private _s3Resource : any
  
    public get s3Resource(){ return this._s3Resource }
    public get ssmResource(){ return this._ssmResource }
    public get acmResource(){ return this._acmResource }
    public get hostedZoneResource(){ return this._hostedZoneResource }
    public get sesResource(){ return this._sesResource }
  
    constructor(scope: Construct, name: string, config: any, backendStateS3BucketName:string) {
      super(scope, name);
  
      new S3Backend(this, {
        bucket: backendStateS3BucketName,
        key: name,
        region: config.defaultRegion
      })
  
      const dataCallerIdentity = new DataAwsCallerIdentity(this,"dataCallerIdentity",{})
      const accountId = dataCallerIdentity.accountId
   
      new AwsProvider(this, "aws", {alias: "global", region: config.defaultRegion});
  
      //hard code a us-east-1 for cloudfront ssl certs (only available in us-east-1)
      const awsUsEast1Provider = new AwsProvider(this, "awsUse1", { alias: 'use1e',region: 'us-east-1' });
  
      //get Ssm Parameters that were manually set up using Ssm Parameter Store
      this._ssmResource = new Ssm(this, "ssm", config.parameterStorePrefix)
      const iamResource = new Iam(this, "Iam", accountId, config.hostedZone, config.defaultRegion)
      
      //sometimes SES Error: Error setting MAIL FROM domain: InvalidParameterValue: Identity <s6pack.build> does not exist. Just wait a minute and re-reploy
      this._sesResource = new Ses(this, "Ses", config, iamResource.jsonStringPolicies['sesIdentityPolicy'])
      this._acmResource = new Acm(this, "acm", config.hostedZone, config, awsUsEast1Provider)
      this._hostedZoneResource = new Route53HostedZone(this, "route53HostedZone", config.defaultRegion, config.hostedZone, config.sesMailDomain, this._sesResource, this._acmResource)
      
      this._s3Resource = new S3(this, "website-log-bucket")
      this._s3Resource.CreateCloudfrontLoggingBucket("cloudfront-logs", config.logBucketNamePrefix+"-cloudfront-logs", config.logRetentionPeriod)
      new TerraformOutput(this, 'HostedZoneId', { value: this._hostedZoneResource.zone.id})
      new TerraformOutput(this, 'S3BucketName', { value: this._s3Resource.s3CloudfrontLoggingBucket.bucketDomainName})
  
    }
  }