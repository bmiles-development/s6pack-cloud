import { Construct } from 'constructs';
import {IamRolePolicyAttachment} from '@cdktf/provider-aws/lib/iam-role-policy-attachment'
import {IamRole} from '@cdktf/provider-aws/lib/iam-role'
import {IamPolicy} from '@cdktf/provider-aws/lib/iam-policy'

export class Iam extends Construct {
    private _roles: any = {}
    private _policies: any = {}
    private _policyAttachments: any = {}
    public get roles(){
        return this._roles
    }

    public get policies(){
        return this._policies
    }

    public get policyAttachments(){
        return this._policyAttachments
    }

    constructor(scope: Construct, name: string, awsAccountId:string, region:string, stackName:string) {
        super(scope, name);


        this._roles['cognitoSnsRole'] = new IamRole(this, stackName+'-cognito_sns_role', {
            name: stackName+'-cognito_sns_role',
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: {
                        Service: "cognito-idp.amazonaws.com"
                    },
                    Action: "sts:AssumeRole",
                    Sid: ""
                }]
            }),
            tags: {
                name: stackName
            }
        })

        this._policies['cognitosSnsPolicy'] = new IamPolicy(this,  'cognito_sns_policy', {
            name: stackName+'-cognito_sns_policy',
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Action: ['sns:publish'],
                    Resource: "*"
                }]
            }),
            tags: {
                name: stackName
            }
        });

        this._policyAttachments['cognito_sns_iam_attachment'] = new IamRolePolicyAttachment(this,  stackName+'-cognito_sns_iam_attachment', {
            role: this._roles['cognitoSnsRole'].name as string,
            policyArn: this._policies['cognitosSnsPolicy'].arn
        });


        this._roles['lambdaServiceRole'] = new IamRole(this, 'lambda_service_role', {
            name: stackName+'-lambda_service_role',
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

        this._policies['lambdaPolicy'] = new IamPolicy(this,  stackName+'-lambda_policy', {
            name: stackName+'-lambda_policy',
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

        this._roles['snsServiceRole'] = new IamRole(this, 'sns_service_role', {
            name: stackName+'sns_role',
            path: "/",
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: {
                        Service: "sns.amazonaws.com"
                    },
                    Action: ["sts:AssumeRole"],
                }]
            }),
            tags: {
                name: stackName
            }
        })


        this._roles['stepFunctionsServiceRole'] = new IamRole(this,  stackName+'-step_functions_service_role', {
            name: stackName+'-step_functions_service_role',
            path: "/",
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: {
                        Service: "states."+region+".amazonaws.com"
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
                        "arn:aws:states:"+region+":"+awsAccountId+":stateMachine:*"
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
