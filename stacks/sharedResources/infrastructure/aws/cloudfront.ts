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
                allowedMethods: ["GET", "HEAD"],
                cachedMethods: ["GET", "HEAD"],
                targetOriginId: originId,
                forwardedValues: {
                    queryString : true,
                    cookies: {
                        forward:"none"
                    }
                },
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

    public newLambdaURLDistribution(name:string, websiteDomainName:any, acmCertArn:any, originId:string, loggingBucket:any, aliases:any, customHeaderLambdaAccessKey:string, lambdaCloudfronViewerRequestArn:any){

        return this._cloudfrontDistributions[name] = new CloudfrontDistribution(this, name+"_lambdaUrlCloudfront",{
            enabled : true,
            aliases: aliases, //add domainApexName for toggling apex name to blue/green
            origin: [{
                originId: originId, 
                domainName: websiteDomainName,
                customOriginConfig: {
                    httpPort: 80,
                    httpsPort: 443,
                    originProtocolPolicy: "https-only",
                    originSslProtocols:["TLSv1.2"]
                },
                customHeader: [{
                    name: "Lambda-url-access",
                    value: customHeaderLambdaAccessKey
                }]
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