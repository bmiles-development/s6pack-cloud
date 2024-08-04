
import {SfnStateMachine} from '@cdktf/provider-aws/lib/sfn-state-machine'
import { Construct } from "constructs";

export class StepFunctions extends Construct {

  private  _stepFunctionDefinitions : any = {};
  private readonly _iamServiceRoleArn: any = {};
  private readonly _logGroupName : any = {};
  private readonly _logLevel : any = {};
  protected readonly _stackName : any = {};
  private _stepFunctions : any = {};
  private _region : any = {};
  private _accountId : any = {};
  public get stepFunctionDefinitions(){
    return this._stepFunctionDefinitions
  }
  public get region(){
    return this._region
  }
  public get accountId(){
    return this._accountId
  }
  get stepFunctions(){
      return this._stepFunctions;
  }

  /* sfnUserDefinitionListMap is something like
  *  { "Title" : []stepFunctionDefinitions }
  */
  constructor(scope: Construct, name: string, logLevel:string, stackName:string, stepFunctionDefinitions:any, iamServiceRoleArn:any, logGroupName:string, region:string, accountId:string) {
    super(scope,name)
    this._stepFunctionDefinitions = stepFunctionDefinitions
    this._iamServiceRoleArn = iamServiceRoleArn
    this._logGroupName = logGroupName
    this._logLevel = logLevel
    this._stackName = stackName
    this._region = region
    this._accountId = accountId

    Object.entries(this._stepFunctionDefinitions).forEach(([mkey, _mvalue], _mindex) => {
      this.addStepFunction(mkey, this._stackName, this._stepFunctionDefinitions[mkey], this._iamServiceRoleArn)
    })
  }

  public addStepFunction(name: string, stackName:string, stepFunctionDefinition:string, iamServiceRoleArn:any){
    this._stepFunctions[name] = new SfnStateMachine(this,name, {
      type: "EXPRESS",
      name: stackName+"-"+name,
      roleArn: iamServiceRoleArn,
      loggingConfiguration: {
        includeExecutionData: true,
        level: this._logLevel,
        logDestination: this._logGroupName
      },
      definition: stepFunctionDefinition,
      tracingConfiguration: {enabled:true},
    })
  }
}

