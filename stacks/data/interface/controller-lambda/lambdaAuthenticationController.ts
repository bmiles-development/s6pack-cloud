import { Construct } from 'constructs';

export class LambdaAuthenticationController extends Construct {
  private _lambdaControllers: any = {};

  constructor(scope: Construct, name: string, lambdaResource:any, controllerPath:string, defaultLambdaEnvVars:any) {
    super(scope, name)
    this._lambdaControllers["postConfirmationTrigger"] = lambdaResource.CreateLambdaNodeJsFunction("postConfirmationTrigger", controllerPath, defaultLambdaEnvVars)
    this._lambdaControllers["preTokenGenerationTrigger"] = lambdaResource.CreateLambdaNodeJsFunction("preTokenGenerationTrigger", controllerPath, defaultLambdaEnvVars)
    
    return this._lambdaControllers

  }
}
