import { Fn } from 'cdktf';
import { Construct } from 'constructs';
import { join } from 'path';

export class UserService extends Construct {
    private _stepFunctionDefinitions: any = {}

    public get stepFunctionDefinitions(){
        return this._stepFunctionDefinitions
    }


  constructor(scope:Construct, name:string, cognitoEntity:any, dataStackName:string, filePath:string) {
    super(scope, name)

    this._stepFunctionDefinitions["addStandardUser"] = Fn.templatefile(join(filePath,"addStandardUser.asl.json"), {
      cognitoEntity: cognitoEntity,
      dataStackName: dataStackName
    })
    this._stepFunctionDefinitions["addAdminUser"] = Fn.templatefile(join(filePath,"addAdminUser.asl.json"), {
      cognitoEntity: cognitoEntity
    })
    this._stepFunctionDefinitions["getUser"] = Fn.templatefile(join(filePath,"getUser.asl.json"), {
      cognitoEntity: cognitoEntity
    })
    this._stepFunctionDefinitions["listUsers"] = Fn.templatefile(join(filePath,"listUsers.asl.json"), {
      cognitoEntity: cognitoEntity
    })
    this._stepFunctionDefinitions["getUserGroup"] = Fn.templatefile(join(filePath,"getUserGroup.asl.json"), {
      cognitoEntity: cognitoEntity
    })
    this._stepFunctionDefinitions["deleteAdminUser"] = Fn.templatefile(join(filePath,"deleteAdminUser.asl.json"), {
      cognitoEntity: cognitoEntity
    })
    this._stepFunctionDefinitions["deleteStandardUser"] = Fn.templatefile(join(filePath,"deleteStandardUser.asl.json"), {
      cognitoEntity: cognitoEntity
    })
    this._stepFunctionDefinitions["changeStandardUserToAdmin"] = Fn.templatefile(join(filePath,"changeStandardUserToAdmin.asl.json"), {
      cognitoEntity: cognitoEntity
    })
    this._stepFunctionDefinitions["changeAdminToStandardUser"] = Fn.templatefile(join(filePath,"changeAdminToStandardUser.asl.json"), {
      cognitoEntity: cognitoEntity
    })
    this._stepFunctionDefinitions["activateUser"] = Fn.templatefile(join(filePath,"activateUser.asl.json"), {
      cognitoEntity: cognitoEntity,
      dataStackName: dataStackName
    })
    this._stepFunctionDefinitions["deactivateUser"] = Fn.templatefile(join(filePath,"deactivateUser.asl.json"), {
      cognitoEntity: cognitoEntity
    })
  }
}