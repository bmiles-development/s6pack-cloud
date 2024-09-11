import {Construct} from "constructs"
import {S3Backend, TerraformOutput, TerraformStack} from "cdktf"
import {AwsProvider} from "@cdktf/provider-aws/lib/provider"
import { Cloudfront } from "../sharedResources/infrastructure/aws/cloudfront";
import { Route53 } from "../sharedResources/infrastructure/aws/route53";
import { AppsyncDomainNameResource } from "../sharedResources/infrastructure/aws/appsyncDomainNameResource"
import { Route53Record } from "@cdktf/provider-aws/lib/route53-record";

export class BlueGreenToggleStack extends TerraformStack {
    constructor(
      scope: Construct, 
      name: string, 
      hostingStackZoneId:any,
      hostingStackAcmSSlCertArn:any, 
      hostingStackS3BucketDomainName:any,
      currentLiveWebStack:any,
      defaultRegion:string, 
      graphqlDirectAccessApiUrl:string, 
      domainApexName:string, 
      backendStateS3BucketName:string ,
      liveWebhookDomainName:string
    ){
      super(scope, name);
      new S3Backend(this, {
        bucket: backendStateS3BucketName,
        key: name,
        region: defaultRegion
      })
  
      new AwsProvider(this, "aws", { region: defaultRegion });
      const cloudfront:any = new Cloudfront(this, "domain-apex-name-cloudfront-distributions")
      const route53 = new Route53(this, "route53DomainApexName")

      //add live direct api access endpoint and toggle that to blue green as well
      const appsyncDomainNameResource = new AppsyncDomainNameResource(this, name+"-appsyncDomainName")
      appsyncDomainNameResource.addAppsyncDomainName(graphqlDirectAccessApiUrl, hostingStackAcmSSlCertArn, name)
      appsyncDomainNameResource.addAppsyncDomainNameApiAssociation(currentLiveWebStack.appsyncResource.graphqlApi.id, name)
     
      route53.addCustomDomainToCloudfront(graphqlDirectAccessApiUrl, appsyncDomainNameResource.appsyncDomainNameResource.appsyncDomainName, hostingStackZoneId, currentLiveWebStack.appsyncDomainNameResource.appsyncDomainNameResource.hostedZoneId)
      new TerraformOutput(this, 'appsyncDomainName', { value: graphqlDirectAccessApiUrl })

      //add blueGreenToggle webhook endpoint for stripe
      new Route53Record(this, 'blueGreenWebhookDomainName', {zoneId: hostingStackZoneId, name: liveWebhookDomainName, type: "CNAME", ttl: 60, records: [currentLiveWebStack.webhookDomainName]})
      
     
      
       //website hosted on s3
      cloudfront.newDistribution("blueGreenToggle",currentLiveWebStack.config.s3WebsiteDomainName+"."+currentLiveWebStack._s3WebsiteBucketDomain,  hostingStackAcmSSlCertArn, currentLiveWebStack.s3WebsiteBucketDomain, hostingStackS3BucketDomainName, [domainApexName])
      route53.addS3CloudfrontDomainRoute53Record( domainApexName, cloudfront.cloudfrontDistributions['blueGreenToggle'].domainName, hostingStackZoneId, cloudfront.cloudfrontDistributions['blueGreenToggle'].hostedZoneId)
    }
  }