import { Construct } from 'constructs';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
//import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';


export class Dynamodb extends Construct {
    public readonly _tables: any = {}

    constructor(scope: Construct, stackName: string) {
        super(scope, stackName+"_dynamodb")

        const tableName = stackName+"-locking-consistancy"

        this.createtfStateTable(stackName, tableName)
    }

    private createtfStateTable(stackName:string, tableName:string){
        return new DynamodbTable(this, "tfState",{
            name : tableName,
            billingMode : "PAY_PER_REQUEST",
            hashKey : "LockID",
            attribute : [{
                name : "LockID",
                type : "S"
            }],
            tags : {
                name : stackName+"tf_state",
                environment : stackName
            }
        })
    }

}