import { Construct } from 'constructs'
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket'
import { S3BucketWebsiteConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-website-configuration'
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy'
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document'
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block'
import { S3BucketOwnershipControls } from '@cdktf/provider-aws/lib/s3-bucket-ownership-controls'
 
export class S3 extends Construct {

    private _websiteDomain: any
    private _tfStateBucket: any
    private _s3WebhostingBucketConfiguration: any
    private _s3WebhostingBucket: any
    get s3WebhostingBucketConfiguration(){
        return this._s3WebhostingBucketConfiguration
    }
    get s3WebhostingBucket(){
        return this._s3WebhostingBucket
    }
    get websiteDomain(){
        return this._websiteDomain
    }
    get tfStateBucket(){
        return this._tfStateBucket
    }

    constructor(scope: Construct, name: string) {
        super(scope, name+"_s3")
    }

    public CreateWebhostingBucket(s3WebsiteDomainName:string, name:string){

        const policyDocument = new DataAwsIamPolicyDocument(this, name+"-iam-policy-document",{
            statement: [
                {
                    sid: name+"s3-bucket-public-read-object",
                    effect: "Allow",    
                    principals:[{
                        type: "*",
                        identifiers: ["*"]

                    }],
                    actions: [
                    "s3:GetObject"
                    ],
                    resources: [
                    "arn:aws:s3:::"+s3WebsiteDomainName+"/*"
                    ]
                }
            ]   
        })

        this._s3WebhostingBucket = new S3Bucket(this, name+"_s3Bucket", {
            bucket: s3WebsiteDomainName
        })

        new S3BucketPublicAccessBlock(this, name+"s3-public-access-block", {
            bucket: this._s3WebhostingBucket.id,
            blockPublicAcls: false,
            blockPublicPolicy: false,
            ignorePublicAcls: false,
            restrictPublicBuckets: false
        })

        new S3BucketOwnershipControls(this, "aws_s3_bucket_ownership_controls", {
            bucket: this._s3WebhostingBucket.id,
            rule: {
              objectOwnership: "BucketOwnerPreferred"
            }
        })
        
        new S3BucketPolicy(this, name+'-policy', {
            policy : policyDocument.json,
            bucket : s3WebsiteDomainName
        })

        //Adds routing rule for Single Page Application
        
        this._s3WebhostingBucketConfiguration = new S3BucketWebsiteConfiguration(this, name+"-configuration", {
            bucket: this._s3WebhostingBucket.bucket,
            indexDocument: {
                suffix: "index.html"
            },
            errorDocument: {
                key:"index.html"
            }
        })

       return this._websiteDomain = this._s3WebhostingBucketConfiguration.websiteDomain
    }
}