import { Construct } from 'constructs';
import {IamRolePolicyAttachment} from '@cdktf/provider-aws/lib/iam-role-policy-attachment'
import {IamRole} from '@cdktf/provider-aws/lib/iam-role'
import {IamPolicy} from '@cdktf/provider-aws/lib/iam-policy'
import { CognitoIdentityPoolRolesAttachment } from '@cdktf/provider-aws/lib/cognito-identity-pool-roles-attachment'


export class Iam extends Construct {
    private _awsRegion : string
    private _roles: any = {}
    private _policies: any = {}
    private _policyAttachments: any = {}
    private _jsonStringPolicies: any = {}
    private _awsAccountId: any = {}
    public get roles(){
        return this._roles
    }

    public get policies(){
        return this._policies
    }

    public get policyAttachments(){
        return this._policyAttachments
    }

    public get jsonStringPolicies(){
        return this._jsonStringPolicies
    }
    public get awsAccountId(){
        return this._awsAccountId
    }

     // This is used after a successful stripe webhook plan update to trigger the successfulPlanUpdateNotification appsync graphql (which in-turn triggers a token refresh on the client app)
     public addAppsyncAccessPolicyToLambdaRole(stackName:string, awsRegion:string, awsAccountId:string, graphqlApiId:string, appsyncFields:any){

        this._roles['webhookGatewayLambda'] = new IamRole(this, stackName+'webhook_gateway_lambda_role', {
            name: stackName+'-webhookGatewayLambda',
            path: "/",
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: {
                        Service: "lambda.amazonaws.com"
                    },
                    Action: ["sts:AssumeRole"],
                }]
            }),
            tags: {
                name: stackName
            }
        })


        let resources = []
        for (const fieldName in appsyncFields) {
            resources.push("arn:aws:appsync:"+awsRegion+":"+awsAccountId+":apis/"+graphqlApiId+"/types/Mutation/fields/"+appsyncFields[fieldName])
        }

        this._policies['lambdaAppsyncSystemServicePolicy'] = new IamPolicy(this, 'lambda_appsync_system_service_policy', {
            name: stackName+'lambda_appsync_system_service_policy',
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Action: [
                        "appsync:GraphQL",
                    ],
                    Resource: resources
                }]
            }),
            tags: {
                name: stackName
            }
        })

        new IamRolePolicyAttachment(this,  stackName+'-appsync_graphql_access_attachment', {
            role: this._roles['webhookGatewayLambda'].name as string, 
            policyArn: this._policies['lambdaAppsyncSystemServicePolicy'].arn
        });

        //attach logging policies also
        new IamRolePolicyAttachment(this,  stackName+'-lambda_logging_attachment', {
            role: this._roles['webhookGatewayLambda'].name as string, 
            policyArn: this._policies['lambdaLoggingPolicy'].arn
        });
    }


//when destroying and recreating, you may just have to run twice if it ertrors out on the first run. There is
// a timing issue with the roles being created and deleted at the same time.
public addAppsyncIdentityPoolRolesAttachment(stackName:string, awsRegion:string, awsAccountId:string, identityPoolId:string, graphqlApiId:string){

    this._roles['appsyncUnauthenticatedAccessRole'] = new IamRole(this,  stackName+'-appsync_unauthenticated_access_role', {
        name: stackName+'-appsync-unauthenticated-access-role',
        path: "/",
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Effect: "Allow",
                Principal: {
                    Federated: "cognito-identity.amazonaws.com"
                },
                "Condition": {
                    "StringEquals": {
                      "cognito-identity.amazonaws.com:aud": identityPoolId
                    },
                    "ForAnyValue:StringLike": {
                      "cognito-identity.amazonaws.com:amr": "unauthenticated"
                    }
                },
                Action: ["sts:AssumeRoleWithWebIdentity"],
            }]
        }),
        tags: {
            name: stackName
        }
    })

    this._policies['appsyncUnauthenticatedServicePolicy'] = new IamPolicy(this,  stackName+'-appsync_unauthenticated_service_policy', {
        name: stackName+'-appsync_unauthenticated_service_policy',
        policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Effect: "Allow",
                Action: ["appsync:GraphQL"],
                Resource: [
                    "arn:aws:appsync:"+awsRegion+":"+awsAccountId+":apis/"+graphqlApiId+"/types/Mutation/fields/contactUs",
                    "arn:aws:appsync:"+awsRegion+":"+awsAccountId+":apis/"+graphqlApiId+"/types/Query/fields/listPlans"
                ]
            }]
        }),
        tags: {
            name: stackName
        }
    })

    new IamRolePolicyAttachment(this, stackName+'-unauthenticated_appsync_iam_attachment', {
        role: this._roles['appsyncUnauthenticatedAccessRole'].name as string,
        policyArn: this._policies['appsyncUnauthenticatedServicePolicy'].arn
    });

    this._roles['appsyncAuthenticatedAccessRole'] = new IamRole(this,  stackName+'-appsync_authenticated_access_role', {
        name: stackName+'-appsync-authenticated-access-role',
        path: "/",
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Effect: "Allow",
                Principal: {
                    Federated: "cognito-identity.amazonaws.com"
                },
                "Condition": {
                    "StringEquals": {
                      "cognito-identity.amazonaws.com:aud": identityPoolId
                    },
                    "ForAnyValue:StringLike": {
                      "cognito-identity.amazonaws.com:amr": "authenticated"
                    }
                },
                Action: ["sts:AssumeRoleWithWebIdentity"],
            }]
        }),
        tags: {
            name: stackName
        }
    })

    this._policies['appsyncAuthenticatedServicePolicy'] = new IamPolicy(this,  stackName+'-appsync_authenticated_service_policy', {
        name: stackName+'-appsync_authenticated_service_policy',
        policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Effect: "Allow",
                Action: ["appsync:GraphQL"],
                Resource: [
                    "arn:aws:appsync:"+awsRegion+":"+awsAccountId+":apis/"+graphqlApiId+"/*"
                ]
            }]
        }),
        tags: {
            name: stackName
        }
    })

    new IamRolePolicyAttachment(this,  stackName+'-authenticated_appsync_iam_attachment', {
        role: this._roles['appsyncAuthenticatedAccessRole'].name as string,
        policyArn: this._policies['appsyncAuthenticatedServicePolicy'].arn
    });



// apply access roles for identity pool so unauthenticated users can use the limited graphql api. Would be in main.ts but circular dependancy issue forced it here

new CognitoIdentityPoolRolesAttachment(this, stackName+'-unauthenticated_identity_pool_role_attachment', {
    identityPoolId: identityPoolId,
    roles: {
        authenticated: this._roles['appsyncAuthenticatedAccessRole'].arn,
        unauthenticated: this._roles['appsyncUnauthenticatedAccessRole'].arn
    }
})
}

    constructor(scope: Construct, name: string, awsAccountId:string, region:any, stackName:string) {
        super(scope, name);

        this._awsRegion = region
        this._awsAccountId = awsAccountId

        this._roles['stripeWebhookValidationlambdaServiceRole'] = new IamRole(this, stackName+'stripe_webhook_lambda_service_role', {
            name: stackName+'-stripeWebhook',
            path: "/",
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: {
                        Service: "lambda.amazonaws.com"
                    },
                    Action: ["sts:AssumeRole"],
                }]
            }),
            tags: {
                name: stackName
            }
        })

        this._policies['lambdaLoggingPolicy'] = new IamPolicy(this, stackName+'lambda_logging_policy', {
            name: stackName+'lambda_logging_policy',
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Action: [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        'events:PutEvents'
                    ],
                    Resource: "*"
                }]
            }),
            tags: {
                name: stackName
            }
        });

        this._policyAttachments['lambda-stripe-webhook-policy-attachment'] = new IamRolePolicyAttachment(this,  stackName+'-stripe-webhook-validation-lambda', {
            role: this._roles['stripeWebhookValidationlambdaServiceRole'].name as string,
            policyArn: this._policies['lambdaLoggingPolicy'].arn
        });

        this._roles['lambdaServiceRole'] = new IamRole(this, stackName+'_lambda_generic_service_role', {
            name: stackName+'-lambda_generic_service_role' ,
            path: "/",
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: {
                        Service: ["lambda.amazonaws.com", "edgelambda.amazonaws.com"]
                    },
                    Action: ["sts:AssumeRole"],
                }]
            }),
            tags: {
                name: stackName
            }
        })

        this._policies['lambdaPolicy'] = new IamPolicy(this, stackName+'_lambda_policy', {
            name: stackName+'_lambda_policy',
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Action: [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        'states:StartSyncExecution',
                        'states:StartExecution',
                        'dynamodb:GetItem',
                        'dynamodb:Query'
                    ],
                    Resource: "*"
                }]
            }),
            tags: {
                name: stackName
            }
        });

        this._policyAttachments['lambda-policy-attachment'] = new IamRolePolicyAttachment(this,  stackName+'-lambda', {
            role: this._roles['lambdaServiceRole'].name as string,
            policyArn: this._policies['lambdaPolicy'].arn
        });


        this._roles['appsyncServiceRole'] = new IamRole(this,  stackName+'_appsync_service_role', {
            name: stackName+'-appsync_service_role',
            path: "/",
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: {
                        Service: "appsync.amazonaws.com"
                    },
                    Action: ["sts:AssumeRole"],
                }]
            }),
            tags: {
                name: stackName
            }
        })

        this._policies['appsyncServicePolicy'] = new IamPolicy(this,  stackName+'_appsync_svc_policy', {
            name: stackName+'-appsync_svc_policy',
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Action: [
                        "states:StartSyncExecution",
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    Resource: "*"//"arn:aws:states:"+this._awsRegion+":"+awsAccountId+":stateMachine:*" //arn:aws:states:us-east-2:712123061483:stateMachine:
                }]
            }),
            tags: {
                name: stackName
            }
        });

        this._policyAttachments['appsync_service_attachment'] = new IamRolePolicyAttachment(this,  stackName+'-appsync_service_attachment', {
            role: this._roles['appsyncServiceRole'].name as string,
            policyArn: this._policies['appsyncServicePolicy'].arn
        });

        this._roles['stepFunctionsServiceRole'] = new IamRole(this,  stackName+'-step_functions_service_role', {
            name: stackName+'-step_functions_service_role',
            path: "/",
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: {
                        Service: "states."+this._awsRegion+".amazonaws.com"
                    },
                    Action: ["sts:AssumeRole"],
                }]
            }),
            tags: {
                name: stackName
            }
        })


        this._policies['stepFunctionsServicePolicy'] = new IamPolicy(this,  stackName+'-step_functions_service_policy', {
            name: stackName+'-step_functions_service_policy',
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Action: ['states:StartSyncExecution'],
                    Resource: [   
                        "arn:aws:states:"+this._awsRegion+":"+awsAccountId+":stateMachine:*"
                    ]
                },
                {
                    Effect: "Allow",
                    Action: [
                        'lambda:InvokeFunction',
                        'lambda:ListFunctions'
                    ],
                    Resource: "*"
                },
                {
                    Effect: "Allow",
                    Action: [
                        'ses:SendEmail',
                        'events:PutTargets',
                        'events:PutRule',
                        'events:DescribeRule',
                        'events:PutEvents',
                        'cognito-idp:AdminUserGlobalSignOut',
                        'cognito-idp:AdminAddUserToGroup',
                        'cognito-idp:AdminCreateUser',
                        'cognito-idp:AdminDeleteUser',
                        'cognito-idp:AdminGetUser',
                        'cognito-idp:AdminListGroupsForUser',
                        'cognito-idp:AdminRemoveUserFromGroup',
                        'cognito-idp:AdminAddUserToGroup',
                        'cognito-idp:AdminUpdateUserAttributes',
                        'cognito-idp:AdminEnableUser',
                        'cognito-idp:AdminDisableUser',
                        'cognito-idp:ListUsers',
                        'states:StartExecution',
                        'states:StartSyncExecution',
                        'logs:CreateLogDelivery',
                        'logs:GetLogDelivery',
                        'logs:UpdateLogDelivery',
                        'logs:DeleteLogDelivery',
                        'logs:ListLogDeliveries',
                        'logs:PutResourcePolicy',
                        'logs:DescribeResourcePolicies',
                        'logs:DescribeLogGroups',
                        'dynamodb:PutItem',
                        'dynamodb:GetItem',
                        'dynamodb:DeleteItem',
                        'dynamodb:UpdateItem',
                        'dynamodb:Query'
                    ],
                    Resource: "*"
                }]
            }),
            tags: {
                name: stackName
            }
        });

        this._policyAttachments['step_functions_iam_attachment'] = new IamRolePolicyAttachment(this,  stackName+'-step_functions_iam_attachment', {
            role: this._roles['stepFunctionsServiceRole'].name as string,
            policyArn: this._policies['stepFunctionsServicePolicy'].arn
        });

    }  
    
}
