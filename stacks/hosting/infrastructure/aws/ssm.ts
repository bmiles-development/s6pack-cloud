
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';
import { Construct } from 'constructs';
export class Ssm extends Construct {
    private _parameters : any = {}

    get parameters(){
      return this._parameters
    }


    constructor(scope: Construct, name: string, parameterStorePrefix:string) {
        super(scope,name)

        this._parameters['testUsername'] = new SsmParameter(this, "testUsername",{
            name : parameterStorePrefix+"testUsername",
            type: "SecureString",
            value: ""
        }).value

        this._parameters['testPassword'] = new SsmParameter(this, "testPassword",{
            name : parameterStorePrefix+"testPassword",
            type: "SecureString",
            value: ""
        }).value

        this._parameters['testUserPoolId'] = new SsmParameter(this, "testUserPoolId",{
            name : parameterStorePrefix+"testUserPoolId",
            type: "SecureString",
            value: ""
        }).value

        this._parameters['testCognitoClientId'] = new SsmParameter(this, "testCognitoClientId",{
            name : parameterStorePrefix+"testCognitoClientId",
            type: "SecureString",
            value: ""
        }).value

        this._parameters['stripeToken-dev'] = new SsmParameter(this, "stripeTokenDev",{
            name : parameterStorePrefix+"stripeToken-dev",
            type: "SecureString",
            value: ""
        }).value

        this._parameters['stripeToken-live'] = new SsmParameter(this, "stripeTokenLive",{
            name : parameterStorePrefix+"stripeToken-live",
            type: "SecureString",
            value: ""
        }).value

        this._parameters['contactUsEmail-dev'] = new SsmParameter(this, "contactUsEmailDev",{
            name : parameterStorePrefix+"contactUsEmail-dev",
            type: "SecureString",
            value: ""
        }).value

        this._parameters['contactUsEmail-live'] = new SsmParameter(this, "contactUsEmailLive",{
            name : parameterStorePrefix+"contactUsEmail-live",
            type: "SecureString",
            value: ""
        }).value

        this._parameters['recaptchaSiteSecret-dev'] = new SsmParameter(this, "recaptchaSiteSecretDev",{
            name : parameterStorePrefix+"recaptchaSiteSecret-dev",
            type: "SecureString",
            value: ""
        }).value

        this._parameters['recaptchaSiteSecret-live'] = new SsmParameter(this, "recaptchaSiteSecretLive",{
            name : parameterStorePrefix+"recaptchaSiteSecret-live",
            type: "SecureString",
            value: ""
        }).value

        this._parameters['stripeWebhookSigningSecret-dev'] = new SsmParameter(this, "stripeWebhookSigningSecretDev",{
            name : parameterStorePrefix+"stripeWebhookSigningSecret-dev",
            type: "SecureString",
            value: ""
        }).value

        this._parameters['stripeWebhookSigningSecret-live'] = new SsmParameter(this, "stripeWebhookSigningSecretLive",{
            name : parameterStorePrefix+"stripeWebhookSigningSecret-live",
            type: "SecureString",
            value: ""
        }).value

        //get acountId and add it to parameters
        const identity = new DataAwsCallerIdentity(this, "identity")
        this._parameters['accountId'] = identity.accountId
    
    }
}
