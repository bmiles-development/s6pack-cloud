import { Construct } from 'constructs';
import {CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';

//this is shared among all stacks so that dev/prodcution/etc stacks can share a hosted zone between eachother
export class Cloudfront extends Construct {
    private _cloudfrontDistributions:any = {}
    private _zone:any = {}
   
    get cloudfrontDistributions(){
        return this._cloudfrontDistributions
    }
    get zone(){
        return this._zone
    }
   

    constructor(scope: Construct, name: string) {
        super(scope, name)
    }

    public newDistribution(name:string, websiteDomainName:any, acmCertArn:any, originId:string, loggingBucket:any, aliases:any){
        let config:any = {
            enabled : true,
            aliases: aliases, //add domainApexName for toggling apex name to blue/green
            origin: [{
                originId: originId, 
                domainName: websiteDomainName,
                customOriginConfig: {
                    httpPort: 80,
                    httpsPort: 443,
                    originProtocolPolicy: "http-only",
                    originSslProtocols:["TLSv1.2"]
                }
            }],
            defaultCacheBehavior: {
                cachePolicyId: "658327ea-f89d-4fab-a63d-7e88639e58f6",
                allowedMethods: ["GET", "HEAD"],
                cachedMethods: ["GET", "HEAD"],
                targetOriginId: originId,
                viewerProtocolPolicy: "redirect-to-https"
            },
            restrictions: {
                geoRestriction: {
                    restrictionType: "none"
                }
                
            },
            viewerCertificate: {
                acmCertificateArn: acmCertArn,
                sslSupportMethod: "sni-only"
            },
            
            loggingConfig: {
                    bucket: loggingBucket,
                    prefix: websiteDomainName+"/cloudfront-logs"
            }
        }

        return this._cloudfrontDistributions[name] = new CloudfrontDistribution(this, name+"_cloudfront", config)
    }
}