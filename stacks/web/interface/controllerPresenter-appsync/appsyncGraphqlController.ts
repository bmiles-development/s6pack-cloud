import { Construct } from 'constructs';
import { Fn } from 'cdktf';
import { join } from 'path';

export class AppSyncGraphqlController extends Construct {
  private _graphqlResolvers: any = {};

  private DATASOURCES =  {
    "NONE" : "NONE",
    "STEP_FUNCTIONS" : "STEP_FUNCTIONS"
  }

  public get graphqlResolvers(){
    return this._graphqlResolvers
  }

  constructor(scope: Construct, name: string, accountId:string, region:string, stackName:string, filePath:string) {
    super(scope, name)
    
    this._graphqlResolvers['Tenant-trialPeriodTimestamp'] = {
      type: "Tenant",
      field: "trialPeriod",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"FieldLevelRequestResolver-Tenant.trialPeriod.vtl"), {
        stateMachineName: 'getTrialPeriod',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['Tenant-plan'] = {
      type: "Tenant",
      field: "plan",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"FieldLevelRequestResolver-Tenant.plan.vtl"), {
        stateMachineName: 'getPlan',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['addAdminUser'] = {
      type: "Mutation",
      field: "addAdminUser",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'addAdminUser',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['addStandardUser'] = {
      type: "Mutation",
      field: "addStandardUser",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'addStandardUser',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['deleteAdminUser'] = {
      type: "Mutation",
      field: "deleteAdminUser",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'deleteAdminUser',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['enableDeleteAccount'] = {
      type: "Mutation",
      field: "enableDeleteAccount",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'enableDeleteAccount',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['disableDeleteAccount'] = {
      type: "Mutation",
      field: "disableDeleteAccount",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'disableDeleteAccount',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['deleteAccount'] = {
      type: "Mutation",
      field: "deleteAccount",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'deleteAccount',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['deleteStandardUser'] = {
      type: "Mutation",
      field: "deleteStandardUser",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'deleteStandardUser',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['changeStandardUserToAdmin'] = {
      type: "Mutation",
      field: "changeStandardUserToAdmin",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'changeStandardUserToAdmin',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['changeAdminToStandardUser'] = {
      type: "Mutation",
      field: "changeAdminToStandardUser",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'changeAdminToStandardUser',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['activateUser'] = {
      type: "Mutation",
      field: "activateUser",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'activateUser',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['deactivateUser'] = {
      type: "Mutation",
      field: "deactivateUser",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'deactivateUser',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['getUser'] = {
      type: "Query",
      field: "getUser",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'getUser',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['listUsers'] = {
      type: "Query",
      field: "listUsers",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'listUsers',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['checkout'] = {
      type: "Query",
      field: "checkout",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'checkout',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['getUpcomingInvoice'] = {
      type: "Query",
      field: "getUpcomingInvoice",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'getUpcomingInvoice',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['changePlan'] = {
      type: "Mutation",
      field: "changePlan",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'changePlan',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['createPlanIntent'] = {
      type: "Mutation",
      field: "createPlanIntent",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'createPlanIntent',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['createPaymentMethodIntent'] = {
      type: "Mutation",
      field: "createPaymentMethodIntent",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'createPaymentMethodIntent',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['cancelPlanPeriodEndedWebhook'] = {
      type: "Mutation",
      field: "cancelPlanPeriodEndedWebhook",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'cancelPlanPeriodEndedWebhook',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['reactivateCancelingPaidPlan'] = {
      type: "Mutation",
      field: "reactivateCancelingPaidPlan",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'reactivateCancelingPaidPlan',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['cancelPaidPlanAtPeriodEnd'] = {
      type: "Mutation",
      field: "cancelPaidPlanAtPeriodEnd",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'cancelPaidPlanAtPeriodEnd',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['contactUs'] = {
      type: "Mutation",
      field: "contactUs",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'contactUs',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['listPlans'] = {
      type: "Query",
      field: "listPlans",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'listPlans',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['listCharges'] = {
      type: "Query",
      field: "listCharges",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'listCharges',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['listInvoices'] = {
      type: "Query",
      field: "listInvoices",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'listInvoices',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['listPaymentMethods'] = {
      type: "Query",
      field: "listPaymentMethods",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'listPaymentMethods',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['deletePaymentMethod'] = {
      type: "Mutation",
      field: "deletePaymentMethod",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'deletePaymentMethod',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['setDefaultPaymentMethod'] = {
      type: "Mutation",
      field: "setDefaultPaymentMethod",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'setDefaultPaymentMethod',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['getPlan'] = {
      type: "Query",
      field: "getPlan",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'getPlan',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['paymentMethodAdded'] = {
      type: "Subscription",
      field: "paymentMethodAdded",
      datasource: this.DATASOURCES.NONE,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolverUsingTenantId-subscription.vtl"), {
        stateMachineName: 'paymentMethodAdded',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolverless.vtl"))
    }

    this._graphqlResolvers['planModified'] = {
      type: "Subscription",
      field: "planModified",
      datasource: this.DATASOURCES.NONE,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver-subscription.vtl"), {
        stateMachineName: 'planModified',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver-subscription.vtl"))
    }

    this._graphqlResolvers['userAdded'] = {
      type: "Subscription",
      field: "userAdded",
      datasource: this.DATASOURCES.NONE,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolverUsingTenantId-subscription.vtl"), {}),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver-subscription.vtl"))
    }

    this._graphqlResolvers['userDeleted'] = {
      type: "Subscription",
      field: "userDeleted",
      datasource: this.DATASOURCES.NONE,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolverUsingTenantId-subscription.vtl"),{}),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver-subscription.vtl"))
    }

    this._graphqlResolvers['planCanceled'] = {
      type: "Subscription",
      field: "planCanceled",
      datasource: this.DATASOURCES.NONE,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver-subscription.vtl"),{}),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver-subscription.vtl"))
    }

    this._graphqlResolvers['confirmAddPlan'] = {
      type: "Mutation",
      field: "confirmAddPlan",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'confirmAddPlan',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['confirmAddPaymentMethod'] = {
      type: "Mutation",
      field: "confirmAddPaymentMethod",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'confirmAddPaymentMethod',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }
    
    this._graphqlResolvers['getTenant'] = {
      type: "Query",
      field: "getTenant",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'getTenant',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['getTenantTrialPeriod'] = {
      type: "Query",
      field: "getTenantTrialPeriod",
      datasource: this.DATASOURCES.STEP_FUNCTIONS,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver.vtl"), {
        stateMachineName: 'getTenantTrialPeriod',
        region: region,
        accountId: accountId,
        stackName:stackName
      }),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver.vtl"))
    }

    this._graphqlResolvers['accountDeleted'] = {
      type: "Subscription",
      field: "accountDeleted",
      datasource: this.DATASOURCES.NONE,
      requestTemplate: Fn.templatefile(join(filePath,"genericRequestResolver-subscription.vtl"),{}),
      responseTemplate: Fn.file(join(filePath,"../controllerPresenter-appsync/genericResponseResolver-subscription.vtl"))
    }
  }
}
