const { SFN } = require("@aws-sdk/client-sfn");

exports.handler = (event, context, callback) => {
    var region = process.env.REGION;
    var accountId = process.env.ACCOUNT_ID;
    var stackName = process.env.STACK_NAME;
    var params = {
        stateMachineArn: "arn:aws:states:" + region + ":" + accountId + ":stateMachine:" + stackName + "-cognitoPostConfirmationTrigger",
        input: JSON.stringify({ "userSub": event.request.userAttributes["sub"]})
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
                callback(null, event);
            }
        }
    });
}