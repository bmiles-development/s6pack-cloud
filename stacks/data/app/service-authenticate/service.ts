import { Fn } from 'cdktf';
import { Construct } from 'constructs';
import { join } from 'path';

export class AuthenticateService extends Construct {
    private _stepFunctionDefinitions:any = {}

    public get stepFunctionDefinitions(){
      return this._stepFunctionDefinitions
    }

    constructor(scope: Construct, name: string, cognitoEntity: any, dataStackName:string, filePath:string, freePlanDBKey:string) {
        super(scope, name)

        this._stepFunctionDefinitions["cognitoPreTokenGenerationTrigger"] =  Fn.templatefile(join(filePath,"cognitoPreTokenGenerationTrigger.asl.json"), {
          dataStackName: dataStackName,
        })

        this._stepFunctionDefinitions["cognitoPostConfirmationTrigger"] =  Fn.templatefile(join(filePath,"cognitoPostConfirmationTrigger.asl.json"), {
          dataStackName: dataStackName,
          freePlanDBKey: freePlanDBKey,
          cognitoEntity: cognitoEntity
        })

    }

}