import { Fn } from 'cdktf';
import { Construct } from 'constructs';
import { join } from 'path';

export class AccountService extends Construct {
  private _stepFunctionDefinitions: any = {}

  public get stepFunctionDefinitions(){
      return this._stepFunctionDefinitions
  }

  constructor(scope:Construct, name:string, cognitoEntity:any, contactUsEmail:string, captchaEntity:any, dataStackName:string, filePath:string, stripeApiEntity:any, freePlanDBKey:any, trialPeriodDays:string, trialPeriodCalculationFunction:any, filterUsersToDeactivateFunctionFunctionArn:any, subtractionFunctionArn:any, checkCancelDeadlinePassedFunction:any, stripeWebhookValidationEntity:any) {
      super(scope, name)

      this._stepFunctionDefinitions["contactUs"] =  Fn.templatefile(join(filePath,"contactUs.asl.json"), {
        captchaEntity: captchaEntity,
        contactUsEmail: contactUsEmail
      })
      this._stepFunctionDefinitions["enableDeleteAccount"] = Fn.templatefile(join(filePath,"enableDeleteAccount.asl.json"), {
        dataStackName: dataStackName
      })
      this._stepFunctionDefinitions["disableDeleteAccount"] = Fn.templatefile(join(filePath,"disableDeleteAccount.asl.json"), {
        dataStackName: dataStackName
      })
      this._stepFunctionDefinitions["deleteAccount"] = Fn.templatefile(join(filePath,"deleteAccount.asl.json"), {
        dataStackName: dataStackName,
        cognitoEntity: cognitoEntity,
        stripeApiEntity: stripeApiEntity
      })
      this._stepFunctionDefinitions["getTenant"] = Fn.templatefile(join(filePath,"getTenant.asl.json"), {
        trialPeriodDays: trialPeriodDays,
        dataStackName: dataStackName
      })
      this._stepFunctionDefinitions["getTenantTrialPeriod"] = Fn.templatefile(join(filePath,"getTenantTrialPeriod.asl.json"), {
        dataStackName: dataStackName,
        trialPeriodDays: trialPeriodDays,
        trialPeriodCalculationFunction: trialPeriodCalculationFunction,
        stripeApiEntity: stripeApiEntity
      })
      this._stepFunctionDefinitions["changePlan"] = Fn.templatefile(join(filePath,"changePlan.asl.json"), {
        freePlanDBKey: freePlanDBKey, 
        dataStackName: dataStackName,
        stripeApiEntity: stripeApiEntity,
        cognitoEntity: cognitoEntity,
        filterUsersToDeactivateFunctionFunctionArn: filterUsersToDeactivateFunctionFunctionArn,
        subtractionFunctionArn: subtractionFunctionArn
      })
      this._stepFunctionDefinitions["cancelPaidPlan"] = Fn.templatefile(join(filePath,"cancelPaidPlan.asl.json"), {
        freePlanDBKey: freePlanDBKey, 
        dataStackName: dataStackName,
        stripeApiEntity: stripeApiEntity,
        cognitoEntity: cognitoEntity,
      })
      this._stepFunctionDefinitions["cancelPaidPlanAtPeriodEnd"] = Fn.templatefile(join(filePath,"cancelPaidPlanAtPeriodEnd.asl.json"), {
        dataStackName: dataStackName,
        stripeApiEntity: stripeApiEntity,
        cognitoEntity: cognitoEntity,
        trialPeriodCalculationFunction: trialPeriodCalculationFunction
      })
      this._stepFunctionDefinitions["cancelPlanPeriodEndedWebhook"] = Fn.templatefile(join(filePath,"cancelPlanPeriodEndedWebhook.asl.json"), {
        dataStackName: dataStackName,
        stripeApiEntity: stripeApiEntity,
        cognitoEntity: cognitoEntity,
        stripeWebhookValidationEntity: stripeWebhookValidationEntity,
        freePlanDBKey: freePlanDBKey
      })
      this._stepFunctionDefinitions["reactivateCancelingPaidPlan"] = Fn.templatefile(join(filePath,"reactivateCancelingPaidPlan.asl.json"), {
        dataStackName: dataStackName,
        stripeApiEntity: stripeApiEntity,
        cognitoEntity: cognitoEntity,
        checkCancelDeadlinePassedFunction: checkCancelDeadlinePassedFunction
      })
      this._stepFunctionDefinitions["confirmAddPlan"] = Fn.templatefile(join(filePath,"confirmAddPlan.asl.json"), {
        dataStackName: dataStackName,
        stripeApiEntity: stripeApiEntity,
        cognitoEntity: cognitoEntity,
        trialPeriodDays: trialPeriodDays,
        trialPeriodCalculationFunction: trialPeriodCalculationFunction
      })
  }

}