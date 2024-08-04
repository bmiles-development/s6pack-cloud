import { Fn } from 'cdktf';
import { Construct } from 'constructs';
import { join } from 'path';

export class PlanService extends Construct {
  private _stepFunctionDefinitions: any = {}

  public get stepFunctionDefinitions(){
    return this._stepFunctionDefinitions
  }

  constructor(scope: Construct, name: string, dataStackName:string, freePlanDBKey:any, stripeApiEntity:string, filePath:string, trialPeriodDays:string, trialPeriodCalculationFunction:string, selectPlanIdByProcessorPlanIdFunction:string) {
    super(scope, name)

    this._stepFunctionDefinitions["getTrialPeriod"] = Fn.templatefile(join(filePath,"getTrialPeriod.asl.json"), {
      trialPeriodDays: trialPeriodDays,
      trialPeriodCalculationFunction: trialPeriodCalculationFunction
    })
    this._stepFunctionDefinitions["listPlans"] = Fn.templatefile(join(filePath,"listPlans.asl.json"), {
      dataStackName: dataStackName,
      stripeApiEntity: stripeApiEntity
    })
    this._stepFunctionDefinitions["listCharges"] = Fn.templatefile(join(filePath,"listCharges.asl.json"), {
      dataStackName: dataStackName,
      stripeApiEntity: stripeApiEntity
    })
    this._stepFunctionDefinitions["getPlan"] = Fn.templatefile(join(filePath,"getPlan.asl.json"), {
      dataStackName: dataStackName,
      stripeApiEntity: stripeApiEntity
    })
    this._stepFunctionDefinitions["getUpcomingInvoice"] = Fn.templatefile(join(filePath,"getUpcomingInvoice.asl.json"), {
      freePlanDBKey: freePlanDBKey, 
      dataStackName: dataStackName,
      stripeApiEntity: stripeApiEntity
    })
    this._stepFunctionDefinitions["checkout"] = Fn.templatefile(join(filePath,"checkout.asl.json"), {
      freePlanDBKey: freePlanDBKey, 
      dataStackName: dataStackName,
      stripeApiEntity: stripeApiEntity
    })
    this._stepFunctionDefinitions["createPlanIntent"] = Fn.templatefile(join(filePath,"createPlanIntent.asl.json"), {
      freePlanDBKey: freePlanDBKey, 
      dataStackName: dataStackName,
      stripeApiEntity: stripeApiEntity
    })
    this._stepFunctionDefinitions["createPaymentMethodIntent"] = Fn.templatefile(join(filePath,"createPaymentMethodIntent.asl.json"), {
      dataStackName: dataStackName,
      stripeApiEntity: stripeApiEntity
    })
    this._stepFunctionDefinitions["confirmAddPaymentMethod"] = Fn.templatefile(join(filePath,"confirmAddPaymentMethod.asl.json"), {
      dataStackName: dataStackName,
      stripeApiEntity: stripeApiEntity
    })

    this._stepFunctionDefinitions["listPaymentMethods"] = Fn.templatefile(join(filePath,"listPaymentMethods.asl.json"), {
      dataStackName: dataStackName, 
      stripeApiEntity: stripeApiEntity
    })
    this._stepFunctionDefinitions["setDefaultPaymentMethod"] = Fn.templatefile(join(filePath,"setDefaultPaymentMethod.asl.json"), {
      dataStackName: dataStackName,
      stripeApiEntity: stripeApiEntity
    })
    this._stepFunctionDefinitions["deletePaymentMethod"] = Fn.templatefile(join(filePath,"deletePaymentMethod.asl.json"), {
      freePlanDBKey: freePlanDBKey, 
      dataStackName: dataStackName,
      stripeApiEntity: stripeApiEntity
    })  
    this._stepFunctionDefinitions["listInvoices"] = Fn.templatefile(join(filePath,"listInvoices.asl.json"), {
      dataStackName: dataStackName,
      stripeApiEntity: stripeApiEntity,
      selectPlanIdByProcessorPlanIdFunction: selectPlanIdByProcessorPlanIdFunction
    })
  }
}