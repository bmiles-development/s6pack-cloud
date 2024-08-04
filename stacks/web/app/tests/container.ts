import { GenericContainer, Wait } from 'testcontainers';

export const exposedPort = 8083;
export const stepFunctionTestContainerName = 'StepFunctionTestContainer';

export const mockFileLocalPath = 'changePlanMock.json'
export const mockFileContainerPath ='/home/StepFunctionsLocal/MockConfigFile.json';

export const stepFunctionContainerFactory = (): GenericContainer => {
 return new GenericContainer('amazon/aws-stepfunctions-local')
 .withExposedPorts(exposedPort)
 .withBindMounts([{source: mockFileLocalPath, target: mockFileContainerPath, mode:'ro'}])
 .withName(stepFunctionTestContainerName)
 .withWaitStrategy(
 Wait.forLogMessage(RegExp(`.*Starting server on port ${exposedPort}.*`))
 );
};

