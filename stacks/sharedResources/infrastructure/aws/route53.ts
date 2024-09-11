import { Construct } from 'constructs';
import {Route53Record} from '../../../../.gen/providers/aws/route53-record'

export class Route53 extends Construct {

    constructor(scope: Construct, name: string ) {
        super(scope, name)
    }

    public addCustomDomainToCloudfront(domainName:string, cloudfrontUrl:string, route53ZoneId:string, aliasZoneId:string){
        //cloudfront formation association used for appsync custom domain
        
        new Route53Record(this, domainName+"-appsync-custom-domain", {
            zoneId: route53ZoneId,
            name: domainName,
            type: "A",
            alias: {
                name: cloudfrontUrl,
                zoneId: aliasZoneId,
                evaluateTargetHealth: true
            }
        })
    }

    public addS3CloudfrontDomainRoute53Record(s3WebsiteDomainName:string, cloudFrontAlias:string, route53ZoneId:string, cloudfrontZoneId:string){
        //cloudfront formation association used for appsync custom domain
        new Route53Record(this, s3WebsiteDomainName+"-s3-custom-domain",  {
            zoneId: route53ZoneId,
            name: s3WebsiteDomainName,
            type: "A",
            alias: {
                name: cloudFrontAlias,
                zoneId: cloudfrontZoneId,
                evaluateTargetHealth: true
            }
        })
    }

}
