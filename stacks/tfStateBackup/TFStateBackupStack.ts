import {Construct} from "constructs"
import {S3Backend} from "cdktf" 
import {TerraformStack} from "cdktf"
import { AwsProvider } from "@cdktf/provider-aws/lib/provider"
import { Dynamodb as TFStateDynamoDb } from './infrastructure/aws/dynamodb'
import { S3 } from "./infrastructure/aws/s3"

export class TFStateBackupStack extends TerraformStack {
    /* this stack is created to house the tfstate files remotely on S3 (for numerous reasons, 
      mainly to avoid syncing issues across multiple machines, and also for .gitignoring these 
      fles as they contain sensitive info) */
  private _s3Resource : any
  private _dynamoDb : any
  public get s3Resource(){ return this._s3Resource }
  public get dynamoDb(){ return this._dynamoDb }

  constructor(scope: Construct, name: string, backendStateS3BucketName:string, region: string, useS3TfState:boolean) {
    super(scope, name);
    new AwsProvider(this, "aws", { region: region });

    if(useS3TfState){
      new S3Backend(this, {
        bucket: backendStateS3BucketName,
        key: name,
        region: region
      })
    }

    this._s3Resource = new S3(this, "tfStateBackupS3", backendStateS3BucketName)

    this._dynamoDb = new TFStateDynamoDb(this, 'tfStateBackupStack')

    
  }
  
}
