import { Construct } from 'constructs';
import { CloudwatchEventBus } from '@cdktf/provider-aws/lib/cloudwatch-event-bus'
import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';
  
  export class EventBridgeStripeWebhooks extends Construct {
    private _eventBus : any = {}
    private _cloudwatchStripeWebhooksRule :any = {}
    private _rules:any = {}
    private _targets:any = {}

    get eventBus(){
        return this._eventBus
    }

    constructor(scope: Construct, name: string, eventBusName:string, cloudwatchLogGroupArn:any, stepFunctionRulesAndTargets:any, stepFunctionRoleArn:any) {
        super(scope, name)
        this._eventBus = new CloudwatchEventBus(this, eventBusName,{name : eventBusName})

        //add rule for cloudwatch logging
        this._cloudwatchStripeWebhooksRule = new CloudwatchEventRule(this, "cloudwatchStripeWebhooks",{
            name: "cloudwatchStripeWebhooks",
            eventBusName: eventBusName,
            eventPattern: `
            {
                "source": ["stripe.com"]
            }
            `
        })

        //add cloudwatch log target
        new CloudwatchEventTarget(this, name+"_stripeWebhooksTarget",{
            rule: this._cloudwatchStripeWebhooksRule.name,
            eventBusName: eventBusName,
            arn: cloudwatchLogGroupArn
        })
    
        Object.entries(stepFunctionRulesAndTargets).forEach(([mkey, _mvalue], _mindex) => {
            this.addStepfunctionEventRule(mkey, eventBusName, stepFunctionRulesAndTargets[mkey].eventRulePattern)
            this.addStepfunctionEventTarget(mkey, eventBusName, stepFunctionRulesAndTargets[mkey].targetArn, stepFunctionRoleArn)
        })  
    }
    
    public addStepfunctionEventRule(name:string, eventBusName:string, eventRulePattern:string){
        this._rules[name] = new CloudwatchEventRule(this, name+"stepfunction",{
            name: name+"stepfunction",
            eventBusName: eventBusName,
            eventPattern: eventRulePattern
        })
    }

    public addStepfunctionEventTarget(name:string, eventBusName:string, targetArn:string, roleArn:string){
        this._targets[name] = new CloudwatchEventTarget(this, name+"_stepfunctionTarget",{
            rule: this._rules[name].name,
            eventBusName: eventBusName,
            arn: targetArn,
            roleArn: roleArn
        })
    }
}

/*
        //payment_method.attached
        //customer.subscription.updated
        this._stepfunctionCancelPlanRule = new CloudwatchEventRule(this, name+"-stepfunctionCancelPlan",{
            name: stackName+"-stepfunctionCancelPlan",
            eventBusName: eventBusName,
            eventPattern: `
            {
                "detail-type": ["customer.subscription.deleted"]
            }
            `
        })

        //possible statuses: active past_due unpaid canceled incomplete incomplete_expired trialing paused
        this._stepFunctionStripeUpdatedPlanRule = new CloudwatchEventRule(this, name+"-stepFunctionStripeUpdatedPlanRule",{
            name: stackName+"-stepFunctionStripeUpdatedPlanRule",
            eventBusName: eventBusName,
            eventPattern: `
            {
                "detail-type": ["customer.subscription.updated"],
                "detail" : {
                    "data" : {
                        "object" : {
                            "status" : [{ "anything-but": [ "incomplete" ] }]
                        }
                    }
                }
            }
            `
        })
*/