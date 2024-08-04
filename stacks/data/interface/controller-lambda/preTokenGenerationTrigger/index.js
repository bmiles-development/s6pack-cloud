const { SFN } = require("@aws-sdk/client-sfn");

exports.handler = (event, context, callback) => {
    var region = process.env.REGION;
    var accountId = process.env.ACCOUNT_ID;
    var stackName = process.env.STACK_NAME;
    var params = {
        stateMachineArn: "arn:aws:states:" + region + ":" + accountId + ":stateMachine:" + stackName + "-cognitoPreTokenGenerationTrigger",
        input: JSON.stringify({ "tenantId": event.request.userAttributes["name"]})
    };
    var stepfunctions = new SFN()
    console.log(params.stateMachineArn+" - started stepfunction execution...")
    stepfunctions.startSyncExecution(params, (err, data) => {
        if (err) {
            const response = {
                statusCode: 500,
                body: JSON.stringify({
                message: err
            })
        };
        callback(null, response);
        
        } else {
            if(data.error != undefined){
                callback(Error(data.cause));
            } else{
                const tenantPlan = JSON.parse(
                    data.output)
                event.response = {
                    "claimsOverrideDetails": {
                        "claimsToAddOrOverride": {
                            "planUsers": tenantPlan.Plan.TotalUsers,
                            "planId" : tenantPlan.Plan.Id
                        },
                    }
                };
                callback(null, event);
            }
        }
    });
}