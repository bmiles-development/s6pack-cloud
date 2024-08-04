import { exec } from "child_process"
import { Construct } from "constructs"
import { ArchiveProvider } from "@cdktf/provider-archive/lib/provider"
import {LambdaFunction} from '@cdktf/provider-aws/lib/lambda-function'
import {DataArchiveFile} from '@cdktf/provider-archive/lib/data-archive-file'
import { join } from 'path'
import { tmpdir } from "os"
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';

export class Lambda extends Construct{
  protected _lambdas : any = {}
  protected _iamServiceRoleArn : any
  protected _region: any
  protected _stackName: any
  protected _defaultEnvVars: any 
  protected _cloudwatchResource: any
  private _tmpFolderName = "S5P"
  public get lambdas(){
      return this._lambdas
  }
  get defaultEnvVars(){
    return this._defaultEnvVars
  }

  constructor(scope: Construct, stackName: string, region: any, accountId:string, iamServiceRoleArn:any, constructorName:string, cloudwatchResource:any) {
    super(scope, stackName+ constructorName)
    this._iamServiceRoleArn = iamServiceRoleArn
    this._cloudwatchResource = cloudwatchResource
      this._region = region
      this._stackName = stackName
      new ArchiveProvider(this, stackName+"_archive_provider")

      this._defaultEnvVars = {
        ACCOUNT_ID : accountId,
        REGION: this._region,
        STACK_NAME: this._stackName
      }

  }

  public CreateLambdaNodeJsFunction(name:string, workingDir:string, envVars: any, layerArns:string[] = [], iamServiceRoleOverrideArn:any = null, runtime = "nodejs18.x"): any{
    workingDir = join(workingDir,name)
    const tmpFolderName = join(tmpdir(),this._tmpFolderName)
    const filename = join(workingDir,"index.js")
    const zipFilename = join(tmpFolderName,"",name+".zip")
    
    exec('cd '+workingDir+' && mkdir -p '+tmpFolderName+' && zip '+zipFilename+' '+filename+' -j', (err, _stdout, _stderr) => {
    
      if (err !== null) {
        console.log("internal error:")
        console.log(err)
        console.log(_stderr)
        console.log(_stdout)
        throw new Error("failed to zip node.js lambdas")
      } else {
          //console.log("success go build and zip "+zipFilename)
      }
    });

    var dataArchive = new DataArchiveFile(this,name+"_data_archive",{
      type: "zip",
      sourceFile : filename,
      outputFileMode: "0666",
      outputPath: zipFilename
    })

    const functionName = this._stackName+"-"+name
    this._cloudwatchResource.createLambdaLogGroup(this, functionName, this._stackName)

    this._lambdas[name] = new LambdaFunction(this, name, {
      layers: layerArns,
      functionName: functionName,
      handler: "index.handler",
      runtime: runtime,
      sourceCodeHash : dataArchive.outputBase64Sha256,
      filename: zipFilename,
      role: iamServiceRoleOverrideArn? iamServiceRoleOverrideArn : this._iamServiceRoleArn,

      environment: {
        variables: envVars
      },
      tracingConfig: { 
        mode: 'Active'
      }
    })

    //apply permission here since it's very specific to lambda
    new LambdaPermission(this, this._stackName+"-"+name+"lambda-permission",{
      action: "lambda:InvokeFunction",
      functionName: this._stackName+"-"+name,
      principal: "cognito-idp.amazonaws.com"
    })

    exec('rm -fR '+join(tmpdir(),tmpFolderName), (err, _stdout, _stderr) => {
      if (err !== null) {
        console.log("internal error:")
        console.log(err)
        console.log(_stderr)
        console.log(_stdout)
        throw new Error("failed to delete tmp files")
      } else {
          //console.log("success go build and zip "+zipFilename)
      }
    })

    return this._lambdas[name].arn
  }

  public CreateEdgeLambdaNodeJsFunction(awsEastProvider:any, name:string, workingDir:string, layerArns:string[] = [], iamServiceRoleOverrideArn:any = null, runtime = "nodejs18.x"): any{
    workingDir = join(workingDir,name)
    const tmpFolderName = join(tmpdir(),this._tmpFolderName)
    const filename = join(workingDir,"index.js")
    const zipFilename = join(tmpFolderName,"",name+".zip")
    
    exec('cd '+workingDir+' && mkdir -p '+tmpFolderName+' && zip '+zipFilename+' '+filename+' -j', (err, _stdout, _stderr) => {
    
      if (err !== null) {
        console.log("internal error:")
        console.log(err)
        console.log(_stderr)
        console.log(_stdout)
        throw new Error("failed to zip node.js lambdas")
      } else {
          //console.log("success go build and zip "+zipFilename)
      }
    });

    var dataArchive = new DataArchiveFile(this,name+"_data_archive",{
      type: "zip",
      sourceFile : filename,
      outputFileMode: "0666",
      outputPath: zipFilename
    })

    const functionName = this._stackName+"-"+name
    this._cloudwatchResource.createLambdaLogGroup(this, functionName, this._stackName)

    this._lambdas[name] = new LambdaFunction(this, name, {
      provider: awsEastProvider,
      layers: layerArns,
      functionName: functionName,
      handler: "index.handler",
      runtime: runtime,
      sourceCodeHash : dataArchive.outputBase64Sha256,
      filename: zipFilename,
      role: iamServiceRoleOverrideArn? iamServiceRoleOverrideArn : this._iamServiceRoleArn,
      publish: true,
      tracingConfig: { 
        mode: 'Active'
      }
    })

    //apply permission here since it's very specific to lambda
    new LambdaPermission(this, this._stackName+"-"+name+"lambda-permission",{
      provider: awsEastProvider,
      action: "lambda:InvokeFunction",
      functionName: functionName,
      principal: "cognito-idp.amazonaws.com"
    })

    exec('rm -fR '+join(tmpdir(),tmpFolderName), (err, _stdout, _stderr) => {
      if (err !== null) {
        console.log("internal error:")
        console.log(err)
        console.log(_stderr)
        console.log(_stdout)
        throw new Error("failed to delete tmp files")
      } else {
          //console.log("success go build and zip "+zipFilename)
      }
    })

    return this._lambdas[name].qualifiedArn
  }


  public CreateStripeWebhookValidationFunction(stackName:string, workingDir:string, name: string, stripeWebhookSecret:string, isDev:boolean, iamServiceRoleArn:any): any {
    const tmpFolderName = join(tmpdir(),this._tmpFolderName)
    const filename = "app.py"
    const zipFilename = join(tmpFolderName,"",name+".zip")
    workingDir = join(workingDir, name)
    exec('cd '+workingDir+' && mkdir -p '+tmpFolderName+' && zip '+zipFilename+' '+filename+' -j', (err, _stdout, _stderr) => {
    
      if (err !== null) {
        console.log("internal error:")
        console.log(err)
        console.log(_stderr)
        console.log(_stdout)
        throw new Error("failed to zip node.js lambdas")
      } else {
          //console.log("success go build and zip "+zipFilename)
      }
    });

    const type = isDev ? 'dev': 'live'
    var dataArchive = new DataArchiveFile(this,name+type+"_webhooklambda_archive",{
      type: "zip",
      sourceFile : join(workingDir, filename),
      outputFileMode: "0666",
      outputPath: zipFilename
    })

    const functionName = this._stackName+"-"+name
    this._cloudwatchResource.createLambdaLogGroup(this, functionName, this._stackName)
    
    this._lambdas[name] = new LambdaFunction(this, stackName+"-"+name, {
      functionName: functionName,
      handler: "app.lambda_handler",
      runtime: "python3.8",
      filename: zipFilename,
      sourceCodeHash : dataArchive.outputBase64Sha256,
      role: iamServiceRoleArn,
      environment: {
        variables: {
          STRIPE_WEBHOOK_SECRET: stripeWebhookSecret
        }
      }
    })

    this._lambdas[name].functionName = functionName
  
    exec('rm -fR '+join(tmpdir(),tmpFolderName), (err, _stdout, _stderr) => {
      if (err !== null) {
        console.log("internal error:")
        console.log(err)
        console.log(_stderr)
        console.log(_stdout)
        throw new Error("failed to delete tmp files")
      } else {
          //console.log("success go build and zip "+zipFilename)
      }
    });
    return this._lambdas[name].arn
  }

/*
  public CreateLambdaGoFunction(name: string, workingDir: string, accountId:string): any {
    workingDir = join(workingDir, name)
    const tmpFolderName = this._tmpFolderName
    const compiledGoFilename = join(tmpdir(),tmpFolderName,name,"main")
    const zipFilename = join(tmpdir(),tmpFolderName,"",name+".zip")
    
    exec('cd '+workingDir+' && GOOS=linux GO111MODULE=off go build -o '+compiledGoFilename+' && zip '+zipFilename+' '+compiledGoFilename+' -j', (err, _stdout, _stderr) => {
    
      if (err !== null) {
        console.log("internal error:")
        console.log(err)
        console.log(_stderr)
        console.log(_stdout)
        throw new Error("failed to build and zip go lambdas")
      } else {
          //console.log("success go build and zip "+zipFilename)
      }
    });

    var dataArchive = new DataArchiveFile(this,name+"_data_archive",{
      type: "zip",
      sourceFile : compiledGoFilename,
      outputFileMode: "0666",
      outputPath: zipFilename
    })

    const functionName = this._stackName+"-"+name
    this._cloudwatchResource.createLambdaLogGroup(this, functionName, this._stackName)
    
    this._lambdas[name] = new LambdaFunction(this, name, {
      functionName: this._stackName+"-"+name,
      handler: "main",
      runtime: "go1.x",
      filename: zipFilename,
      sourceCodeHash : dataArchive.outputBase64Sha256,
      role: this._iamServiceRoleArn,
      environment: {
        variables: {
          ACCOUNT_ID : accountId,
          REGION: this._region,
          STACK_NAME: this._stackName
        }
      }
    })

    //apply permission here since it's very specific to lambda
    new LambdaPermission(this, this._stackName+"-"+name+"lambda-permission",{
      action: "lambda:InvokeFunction",
      functionName: this._stackName+"-"+name,
      principal: "cognito-idp.amazonaws.com"
    })

    exec('rm -fR '+join(tmpdir(),tmpFolderName), (err, _stdout, _stderr) => {
      if (err !== null) {
        console.log("internal error:")
        console.log(err)
        console.log(_stderr)
        console.log(_stdout)
        throw new Error("failed to delete tmp files")
      } else {
          //console.log("success go build and zip "+zipFilename)
      }
    });

    return this._lambdas[name].arn
  }
  */
}
