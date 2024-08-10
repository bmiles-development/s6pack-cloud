import { Construct } from 'constructs';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { DynamodbTableItem } from '@cdktf/provider-aws/lib/dynamodb-table-item';


export class Dynamodb extends Construct {
    public readonly _tables: any = {}

    constructor(scope: Construct, stackName: string, stripeProducts:any, globalConfigSubscriptions:any, resourceType:string) {
        super(scope, stackName+"_dynamodb")
        this._tables[stackName+'_price_plans'] = this.createPricePlansTable(stackName)
        this.addPricePlanItems(this._tables[stackName+'_price_plans'], stripeProducts, globalConfigSubscriptions, resourceType)
        this._tables[stackName+'_tenants'] = this.createTenantsTable(stackName)
    }

    private addPricePlanItems(dynamodbTable: DynamodbTable, subscrptionPlans:any, globalConfigSubscriptions:any, resourceType:string){
        Object.entries(subscrptionPlans).forEach(([planName, _value], _index) => {
            var mappedConfigSubscriptionPlans = this.getConfigSubscriptionStringMap(globalConfigSubscriptions)
            var productId:any
            if (planName != "Free"){
                productId = subscrptionPlans[planName].productId
            }else{
                productId = "Free"
            }
            new DynamodbTableItem(this, 'item_'+planName,{
                tableName: dynamodbTable.name,
                hashKey : dynamodbTable.hashKey,
                rangeKey: dynamodbTable.rangeKey,
                item: JSON.stringify({
                    "Id": {"S": resourceType+"_"+mappedConfigSubscriptionPlans[planName].id},
                    "SortOrder":{"N": mappedConfigSubscriptionPlans[planName].sortOrder.toString()},
                    "ProcessorPlanId": {"S": productId},
                    "Title": {"S": planName},
                    "StatementDescriptor": {"S": mappedConfigSubscriptionPlans[planName].statementDescriptor},
                    "FeatureList": {"S": mappedConfigSubscriptionPlans[planName].featureList},
                    "PriceSet": {"S": mappedConfigSubscriptionPlans[planName].metadata.pricingSet},
                    "TotalUsers": {"N": mappedConfigSubscriptionPlans[planName].metadata.totalUsers.toString()},
                    "Price":{"N": mappedConfigSubscriptionPlans[planName].price.toString()}   
                })
            })
        })
    }

    private createPricePlansTable(stackName:string){
        return new DynamodbTable(this, "price_plans",{
            name : stackName+"-PricePlans",
            billingMode : "PAY_PER_REQUEST",
            hashKey : "Id",
            attribute : [{
                name : "Id",
                type : "S"
            },{
                name : "PriceSet",
                type : "S"
            },{
                name : "ProcessorPlanId",
                type : "S"
            },{
                name : "SortOrder",
                type : "N"
            }
            ],
            tags : {
                name : stackName+"_price_plans",
                environment : stackName
            },
            globalSecondaryIndex: [{
                name : "PriceSetIndex",
                hashKey: "PriceSet",
                rangeKey: "SortOrder",
                projectionType: "ALL"
            },
            {
                name : "ProcessorPlanIdIndex",
                hashKey: "ProcessorPlanId",
                projectionType: "ALL"
            }]
        })
    }

    private createTenantsTable(stackName:string){
        return new DynamodbTable(this, "tenants",{
            name : stackName+"-Tenants",
            billingMode : "PAY_PER_REQUEST",
            hashKey : "Id",
            attribute : [{
                name : "Id",
                type : "S"
            },{
                name : "ProcessorCustomerId",
                type : "S"
            },{
                name : "TrialPeriodTimestamp",
                type : "N"
            }],
            tags : {
                name : stackName+"-tenants",
                stack : stackName
            },
            globalSecondaryIndex: [{
                name : "ProcessorCustomerIdIndex",
                hashKey: "ProcessorCustomerId",
                projectionType: "ALL"
            },
            {
                name : "TrialPeriodTimestampIndex",
                hashKey: "TrialPeriodTimestamp",
                projectionType: "ALL"
            }]
        })
    }

    private getConfigSubscriptionStringMap(subscrptionPlans:any){
        var stringMap:any = {}
        Object.entries(subscrptionPlans).forEach(([planName, _value], _index) => {
            stringMap[subscrptionPlans[planName].name] = subscrptionPlans[planName]

        })
        return stringMap
    }
}