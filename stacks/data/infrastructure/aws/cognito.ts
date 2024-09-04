import { Construct } from 'constructs'
import { TerraformOutput } from 'cdktf'
import {CognitoUserPool} from '@cdktf/provider-aws/lib/cognito-user-pool'
import {CognitoUserGroup}from '@cdktf/provider-aws/lib/cognito-user-group'
import {CognitoUserPoolClient} from '@cdktf/provider-aws/lib/cognito-user-pool-client'
import { CognitoIdentityPool } from '@cdktf/provider-aws/lib/cognito-identity-pool'


export class Cognito extends Construct {
    public readonly userPool: CognitoUserPool;
    public readonly userPoolArn: string;
    public readonly userPoolClientId: string;
    public readonly userPoolClientOauthScopes: string[];
    
    
    public readonly identityPool: any;


    constructor(scope: Construct, name:string, hostedZone:string, config: any , iamCognitoSnsRole:any, sesDomainIdentityArn:any, postConfirmationTriggerArn:any, preTokenGenerationTriggerArn:any, disableNewUsers: boolean) {
        super(scope, name);

        const snsRole = iamCognitoSnsRole

        const userPool = new CognitoUserPool(this, name+'_user_pool', {
            name: name+'_user_pool',
            adminCreateUserConfig: {
                allowAdminCreateUserOnly: disableNewUsers
            },
            usernameAttributes: ["email"],
            autoVerifiedAttributes: config.cognito.autoVerifiedAttributes,
            accountRecoverySetting: {
                recoveryMechanism: [{
                    name: "verified_email",
                    priority: 1
                }]
            },
            emailConfiguration: {
                emailSendingAccount: "DEVELOPER",
                sourceArn: sesDomainIdentityArn,
                fromEmailAddress: config.cognitoFromEmail+hostedZone,
                replyToEmailAddress:  config.cognitoFromEmail+hostedZone
            },
            mfaConfiguration: config.cognito.mfaConfiguration,
            smsConfiguration: {
                externalId: '_external',
                snsCallerArn: snsRole.arn
            },
            passwordPolicy: {
                minimumLength: config.cognito.passwordPolicy.minimumLength,
                requireLowercase: config.cognito.passwordPolicy.requireLowercase,
                requireNumbers: config.cognito.passwordPolicy.requireNumbers,
                requireSymbols: config.cognito.passwordPolicy.requireSymbols,
                requireUppercase: config.cognito.passwordPolicy.requireUppercase,
                temporaryPasswordValidityDays: config.cognito.passwordPolicy.temporaryPasswordValidityDays
            },
            schema: config.cognito.schema,
            tags: {
                name: hostedZone
            },
            lambdaConfig :{
                postConfirmation: postConfirmationTriggerArn,
                preTokenGeneration: preTokenGenerationTriggerArn
            }
            
        });
        new CognitoUserGroup(this, 'free', {
            name: "Free",
            userPoolId: userPool.id
        }),
        new CognitoUserGroup(this, 'owner', {
            name: "Owner",
            userPoolId: userPool.id
        }),
        new CognitoUserGroup(this, 'admin', {
            name: "Admin",
            userPoolId: userPool.id
        }),
        new CognitoUserGroup(this, 'user', {
            name: "User",
            userPoolId: userPool.id
        })

        const client = new CognitoUserPoolClient(this, name+'-non_generated_secret_client', {
            name: name+'-non_generated_secret_client',
            explicitAuthFlows: config.cognito.explicitAuthFlows,
            userPoolId: userPool.id,
            supportedIdentityProviders: ["COGNITO"]
        });

        this.identityPool = new CognitoIdentityPool(this, name+"_identity_pool", {
            identityPoolName: name+"-identity-pool",
            allowUnauthenticatedIdentities: true,
            cognitoIdentityProviders: [{
                clientId: client.id,
                providerName: userPool.endpoint
            }]
        })

        new TerraformOutput(this, 'UserPoolId', { value: userPool.id })
        new TerraformOutput(this, 'IdentityPoolId', { value: this.identityPool.id })
        new TerraformOutput(this, 'CognitoClientId', { value: client.id })
        
        this.userPool = userPool
        this.userPoolArn = userPool.arn
        this.userPoolClientId = client.id
        this.userPoolClientOauthScopes = client.allowedOauthScopes
    }

}
