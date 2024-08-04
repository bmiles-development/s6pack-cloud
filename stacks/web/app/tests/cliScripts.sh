#TODO: https://instil.co/blog/testing-step-functions-locally/

#run docker container
docker run -p 8083:8083 --mount type=bind,readonly,source=$(pwd)/changePlanMock.json,destination=/home/StepFunctionsLocal/MockConfigFile.json \
  -e SFN_MOCK_CONFIG="/home/StepFunctionsLocal/MockConfigFile.json" \
  amazon/aws-stepfunctions-local

#create state machine
aws stepfunctions --endpoint-url http://localhost:8083 create-state-machine \
--definition file://../service-account/stepFunctionDefinitions/changePlan.asl.json --name "changePlan" --role-arn "arn:aws:iam::012345678901:role/DummyRole"

#run state machine with input data
aws stepfunctions start-execution \
    --endpoint http://localhost:8083 \
    --name executionWithHappyPathMockedServices \
    --state-machine arn:aws:states:us-east-1:123456789012:stateMachine:changePlan#HappyPath \
    --input "{   \"identity\": {       \"claims\": {           \"sub\": \"5d0c8617-28e4-4f73-9f5c-bae176e08abf\",           \"cognito:username\": \"5d0c8617-28e4-4f73-9f5c-bae176e08abf\",           \"name\": \"e7223577-da80-4df7-82e4-2a6fd4a59ded\",           \"planId\": \"dev_vusoqngu3xht4x\",           \"planUsers\": \"5\",           \"email\": \"test@test.com\"       },       \"defaultAuthStrategy\": \"ALLOW\",       \"groups\": [           \"Owner\"       ],       \"issuer\": \"https:\\/\\/cognito-idp.us-east-2.amazonaws.com\\/us-east-2_AwJnQGiC7\",       \"sourceIp\": [           \"98.224.164.173\"       ],       \"sub\": \"5d0c8617-28e4-4f73-9f5c-bae176e08abf\",       \"username\": \"5d0c8617-28e4-4f73-9f5c-bae176e08abf\"   },   \"arguments\": {       \"planId\": \"dev_sdv556h7Hfyzo4\"   }}"

#get entire execution history
aws stepfunctions get-execution-history \
    --endpoint http://localhost:8083 \
    --execution-arn arn:aws:states:us-east-1:123456789012:execution:changePlan:executionWithHappyPathMockedServices