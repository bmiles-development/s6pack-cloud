
import { stepFunctionContainerFactory } from './container';
import { StartedTestContainer } from 'testcontainers';
import { SFN, StartSyncExecutionCommand } from '@aws-sdk/client-sfn';
import stateMachineDefinition from '../service-account/stepFunctionDefinitions/changePlan.asl.json';

let exposedPort= 8083
let sfnClient: SFN;
let container:StartedTestContainer

describe('test step functions', () => {
    beforeAll(async () => {
        container = await stepFunctionContainerFactory().start();

        // Avoid non deterministic behavior - reasoning: https://www.youtube.com/watch?v=4pTfYon6zJ8, 46:33
        await new Promise((f) => setTimeout(f, 2000));

        const host = container.getHost();
        const port = container.getMappedPort(exposedPort);
  
        // @ts-ignore
        sfnClient = new SFN({
            region: 'us-east-1',
            endpoint: `http://${host}:${port}`,
            disableHostPrefix: true
        });
    })

    afterAll(async () => {
        await container.stop();
    })

    test('changePlan', async () => {
        // https://www.binaryheap.com/testing-step-function-workflows-locally/
        const stateMachine = await sfnClient.createStateMachine({
            name: 'changePlan',
            roleArn: 'arn:aws:iam::123456789012:role/DummyRole',
            definition: JSON.stringify(stateMachineDefinition),
            type: 'EXPRESS'
        });
        
        console.log('Container with step function is started 🚀');

        const execution = await sfnClient.startSyncExecution({
            stateMachineArn: stateMachine.stateMachineArn+'#HappyPath',
            name: 'executionWithHappyPathMockedServices',
            input: JSON.stringify({
                "identity": {
                    "claims": {
                        "sub": "5d0c8617-28e4-4f73-9f5c-bae176e08abf",
                        "cognito:username": "5d0c8617-28e4-4f73-9f5c-bae176e08abf",
                        "name": "e7223577-da80-4df7-82e4-2a6fd4a59ded",
                        "planId": "dev_vusoqngu3xht4x",
                        "planUsers": "5",
                        "email": "test@test.com"
                    },
                    "sub": "5d0c8617-28e4-4f73-9f5c-bae176e08abf",
                    "username": "5d0c8617-28e4-4f73-9f5c-bae176e08abf"
                },
                "arguments": {
                    "planId": "dev_sdv556h7Hfyzo4"
                }
            })
        })

        //const startOutput = await sfnClient.send(executionCommand);
        console.log(execution);
        expect(execution.status).toBe("SUCCEEDED");
        /*
        const status = await checkExecutionCompletedStatus(sfnClient, "arn:aws:states:us-east-1:123456789012:execution:changePlan:executionWithHappyPathMockedServices");
        console.log(status);
        function checkExecutionCompletedStatus(sfnClient:any, stateMachineArn:string|undefined) {
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                sfnClient.describeExecution({ executionArn: stateMachineArn }, (err:any, data:any) => {
                  if (err) {
                    reject(err);
                  } else {
                    switch (data.status) {
                      case 'RUNNING':
                        checkExecutionCompletedStatus(sfnClient, stateMachineArn);
                        break;
                      case 'SUCCEEDED':
                        resolve(data);
                        break;
                      default:
                        reject(new Error(`Execution failed with status: ${data.status}`));
                    }
                  }
                });
              }, 100);
            });
          }
        */
    });

})