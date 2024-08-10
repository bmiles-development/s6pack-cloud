import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { Construct } from 'constructs';
import {CloudwatchLogGroup} from '@cdktf/provider-aws/lib/cloudwatch-log-group';

export class Cloudwatch extends Construct {
    private _lambdaLogGroups : any = []
    private _appsyncLogGroups: any = []
    private _eventBridgeLogGroups : any = []
    private _stepFunctionLogGroup: any = {}
    private _alarms : any = {}
    private _retentionPeriod : number
    
    public get eventBridgeLogGroups(){
        return this._eventBridgeLogGroups
    }
    public get appsyncLogGroups(){
        return this._appsyncLogGroups
    }
    public get lambdaLogGroups(){
        return this._lambdaLogGroups
    }
    public get stepFunctionLogGroup(){
        return this._stepFunctionLogGroup
    }

    public lambdaLogGroupNamesArray(){
        let lambdaNames = []
        for (let lambdaName of this._lambdaLogGroups) {
            lambdaNames.push(lambdaName)
        }
        return lambdaNames
    }

    public appsyncLogGroupNamesArray(){
        let appsyncNames = []
        for (let appsyncName of this._appsyncLogGroups) {
            appsyncNames.push(appsyncName)
        }
        return appsyncNames
    }

    public stepFunctionsLogGroupNamesArray(){
        return [this._stepFunctionLogGroup.name]
    }

    constructor(scope: Construct, name: string, retentionPeriod: number, stackName:string) {
        super(scope, name);
        this._retentionPeriod = retentionPeriod
        this._alarms = {}

        this._stepFunctionLogGroup = new CloudwatchLogGroup(scope, stackName+"_step_functions", {
            name: stackName+"/stepFunctions",
            retentionInDays: this._retentionPeriod,
            tags: {
                name: stackName
            }
            //kmsKeyId: //add a kms key for encryption
        })
    }

    public createContactUsLogGroup(scope: Construct, stackName:string){
        this._eventBridgeLogGroups["contactUs"] = new CloudwatchLogGroup(scope, stackName+"_contact_us_logs", {
            name: "/aws/events/"+stackName+"/contactUs",
            retentionInDays: this._retentionPeriod,
            tags: {
                name: stackName
            }
        })
    }

    public createLambdaAlarm(scope: Construct, lambdaName:string, lambdaArn:any, stackName:string){
        this._alarms['stripeInboundWebhook'] = new CloudwatchMetricAlarm(scope, stackName+"_stripe_inbound_webhook_logs",{
            alarmDescription: stackName+" InboundWebhook Lambda for traffic spikes",
            alarmName: stackName+" InboundWebhook-Lambda-Invocation-Alarm-",
            metricName: "Invocations",
            namespace: "AWS/Lambda",
            statistic: "Sum",
            period: 300,
            evaluationPeriods: 2,
            threshold: 2000,
            comparisonOperator: "GreaterThanThreshold",
            dimensions: {
                name: lambdaName,
                value: lambdaArn
            }          
        })
    }

    public createLambdaLogGroup(scope: Construct, lambdaName:string, stackName:string){
        const logGroupName = "/aws/lambda/"+lambdaName
        const logGroup = new CloudwatchLogGroup(scope, lambdaName+"_step_function_logs", {
            name: logGroupName,
            retentionInDays: this._retentionPeriod,
            tags: {
                name: stackName
            }
            //kmsKeyId: //add a kms key for encryption
        })
        this._lambdaLogGroups.push(logGroupName)
        return logGroup
    }

    public createAppsyncLogGroup(scope: Construct, appsyncId:string, appsyncName:string, stackName:string){
        const logGroupName = "/aws/appsync/apis/"+appsyncId
        const logGroup = new CloudwatchLogGroup(scope, appsyncName+"_app_sync_logs", {
             name: logGroupName,
             retentionInDays: this._retentionPeriod,
             tags: {
                 name: stackName
             }
             //kmsKeyId: //add a kms key for encryption
         })
         this._appsyncLogGroups.push(logGroupName)
         return logGroup
     }

     //TODO maybe generate this code dynamically based on the log groups.
     //or use a json file and an Fn import fuction so we can use tf variables. 
     //Currently this function is not being used

     public cloudwatchDashboardSource(){
        return `{
            "widgets": [
                {
                    "height": 1,
                    "width": 24,
                    "y": 13,
                    "x": 0,
                    "type": "text",
                    "properties": {
                        "markdown": "# AppStackDev\n"
                    }
                },
                {
                    "height": 6,
                    "width": 24,
                    "y": 14,
                    "x": 0,
                    "type": "log",
                    "properties": {
                        "query": "SOURCE '/aws/appsync/apis/bqxl5npbgbhzhnfbwxcm4mbzcy' | fields @timestamp, @message, @logStream, @log | filter @message like \"Error\"",
                        "region": "us-east-2",
                        "stacked": false,
                        "view": "table"
                    }
                },
                {
                    "height": 6,
                    "width": 24,
                    "y": 20,
                    "x": 0,
                    "type": "log",
                    "properties": {
                        "query": "SOURCE 'devStack/stepFunctions' | fields @timestamp, @message, @logStream, @log | filter @message like \"Error\"",
                        "region": "us-east-2",
                        "stacked": false,
                        "view": "table"
                    }
                },
                {
                    "height": 1,
                    "width": 24,
                    "y": 0,
                    "x": 0,
                    "type": "text",
                    "properties": {
                        "markdown": "# DataStackDev\n"
                    }
                },
                {
                    "height": 6,
                    "width": 24,
                    "y": 7,
                    "x": 0,
                    "type": "log",
                    "properties": {
                        "query": "SOURCE 'dataStackDev/stepFunctions' | fields @timestamp, @message, @logStream, @log | filter @message like \"Error\"",
                        "region": "us-east-2",
                        "stacked": false,
                        "view": "table"
                    }
                }
            ]
        }`
     }
    
}