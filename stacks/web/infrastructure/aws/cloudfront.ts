import { Construct } from 'constructs';
import {CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';
import {CloudfrontOriginAccessControl} from '@cdktf/provider-aws/lib/cloudfront-origin-access-control';

export class Cloudfront extends Construct {
    private _cloudfrontDistributions:any = {}
   
    get cloudfrontDistributions(){
        return this._cloudfrontDistributions
    }
   
    constructor(scope: Construct, name: string) {
        super(scope, name)
    }

    //move this into a new cloudfront.ts file in stacks/web/infrastructure. It's only used in the webStack.
    public newLambdaURLDistribution(name:string, websiteDomainName:any, acmCertArn:any, originId:string, loggingBucket:any, aliases:any, lambdaCloudfronViewerRequestArn:any){
        const originAccessControl = new CloudfrontOriginAccessControl(this, name+"-LambdaOriginAccessControl", {
            name: name+"-lambdaOriginAccessControl",
            originAccessControlOriginType: "lambda",
            signingBehavior: "always",
            signingProtocol: "sigv4",
        });
        return this._cloudfrontDistributions[name] = new CloudfrontDistribution(this, name+"_lambdaUrlCloudfront",{
            enabled : true,
            aliases: aliases, //add domainApexName for toggling apex name to blue/green
            origin: [{
                originAccessControlId: originAccessControl.id,
                originId: originId, 
                domainName: websiteDomainName,
                customOriginConfig: {
                    httpPort: 80,
                    httpsPort: 443,
                    originProtocolPolicy: "https-only",
                    originSslProtocols:["TLSv1.2"]
                },
            }],
            defaultCacheBehavior: {
                lambdaFunctionAssociation: [
                    {
                      eventType: "viewer-request",
                      includeBody: false,
                      lambdaArn: lambdaCloudfronViewerRequestArn
                    },
                  ],
                originRequestPolicyId: "b689b0a8-53d0-40ab-baf2-68738e2966ac", // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html
                cachePolicyId: "4135ea2d-6df8-44a3-9df3-4b5a84be39ad", // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html
                allowedMethods: ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"],
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
        } )
    

    }
}