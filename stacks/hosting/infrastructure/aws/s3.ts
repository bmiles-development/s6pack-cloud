import { Construct } from 'constructs'
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket'
import { S3BucketAcl } from '@cdktf/provider-aws/lib/s3-bucket-acl'
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block'
import { S3BucketOwnershipControls } from '@cdktf/provider-aws/lib/s3-bucket-ownership-controls'
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration'
 
export class S3 extends Construct {

    private _s3CloudfrontLoggingBucket: any
    
    get s3CloudfrontLoggingBucket(){
        return this._s3CloudfrontLoggingBucket
    }

    constructor(scope: Construct, name: string) {
        super(scope, name+"_s3")
    }

    public CreateCloudfrontLoggingBucket(name:string, bucketName:string, logRetentionDays:number){
        this._s3CloudfrontLoggingBucket = new S3Bucket(this, name+"-s3-cloudfront-logging-bucket", {
            bucket: bucketName
        })

        new S3BucketAcl(this, "cloudfront-logging-bucket-acl", {
            bucket: this._s3CloudfrontLoggingBucket.id,
            acl: "log-delivery-write"
        })

        new S3BucketPublicAccessBlock(this, "s3_bucket_public_access_block",{
            bucket: this._s3CloudfrontLoggingBucket.id,
            blockPublicAcls: false,
            ignorePublicAcls: false,
            blockPublicPolicy: false,
            restrictPublicBuckets: false
        })

        new S3BucketOwnershipControls(this, "aws_s3_bucket_ownership_controls", {
            bucket: this._s3CloudfrontLoggingBucket.id,
            rule: {
              objectOwnership: "BucketOwnerPreferred"
            }
        })

        new S3BucketLifecycleConfiguration(this, 's3-bucket-lifecycle-configuration', {
            bucket: this._s3CloudfrontLoggingBucket.id,
            rule: [{
              id: "logs",
              expiration: {
                days: logRetentionDays
              },
              status: "Enabled"
            }]
        }) 
    }
}