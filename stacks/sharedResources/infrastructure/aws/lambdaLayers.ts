import { join } from 'path'
import { Construct } from "constructs"
import { LambdaLayerVersion } from "@cdktf/provider-aws/lib/lambda-layer-version"

export class LambdaLayers extends Construct{
    protected _lambdaLayers: any = {}
    get lambdaLayers(){
      return this._lambdaLayers
    }
  
    constructor(scope:Construct, stackName: string){
      super(scope, stackName)
      this._lambdaLayers['google-recaptcha'] = new LambdaLayerVersion(this, "google-recaptcha-lambdaLayers",{
        filename: join(__dirname,"lambdaLayers","google","recaptcha.zip"),
        layerName : "google-recaptcha",
        compatibleRuntimes : ["nodejs18.x"]
      })
      this._lambdaLayers['stripe'] = new LambdaLayerVersion(this, "lambdaLayers",{
        filename: join(__dirname,"lambdaLayers","stripe","stripe.zip"),
        layerName : "stripe",
        compatibleRuntimes : ["nodejs18.x"]
      })
      this._lambdaLayers['client-sfn'] = new LambdaLayerVersion(this, "aws-sdk-client-sfn-lambdaLayers",{
        filename: join(__dirname,"lambdaLayers","aws-sdk","client-sfn.zip"),
        layerName : "client-sfn",
        compatibleRuntimes : ["nodejs18.x"]
      })
      this._lambdaLayers['aws4'] = new LambdaLayerVersion(this, "aws4-lambdaLayers",{
        filename: join(__dirname,"lambdaLayers","aws4","aws4.zip"),
        layerName : "aws4",
        compatibleRuntimes : ["nodejs18.x"]
      }) 
      this._lambdaLayers['moment'] = new LambdaLayerVersion(this, "moment-lambdaLayers",{
        filename: join(__dirname,"lambdaLayers","moment","moment.zip"),
        layerName : "moment",
        compatibleRuntimes : ["nodejs18.x"]
      })
    }
  }