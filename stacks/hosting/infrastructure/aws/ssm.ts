
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsSsmParameter } from '@cdktf/provider-aws/lib/data-aws-ssm-parameter';
import { Construct } from 'constructs';
export class Ssm extends Construct {
    private _parameters : any = {}

    get parameters(){
      return this._parameters
    }


    constructor(scope: Construct, name: string, parameterStorePrefix:string) {
        super(scope,name)

        this._parameters['testUsername'] = new DataAwsSsmParameter(this, "testUsername",{
            name : parameterStorePrefix+"testUsername"
        }).value

        this._parameters['testPassword'] = new DataAwsSsmParameter(this, "testPassword",{
            name : parameterStorePrefix+"testPassword"
        }).value

        this._parameters['testUserPoolId'] = new DataAwsSsmParameter(this, "testUserPoolId",{
            name : parameterStorePrefix+"testUserPoolId"
        }).value

        this._parameters['testCognitoClientId'] = new DataAwsSsmParameter(this, "testCognitoClientId",{
            name : parameterStorePrefix+"testCognitoClientId"
        }).value

        this._parameters['stripeToken-dev'] = new DataAwsSsmParameter(this, "stripeTokenDev",{
            name : parameterStorePrefix+"stripeToken-dev"
        }).value

        this._parameters['stripeToken-live'] = new DataAwsSsmParameter(this, "stripeTokenLive",{
            name : parameterStorePrefix+"stripeToken-live"
        }).value

        this._parameters['contactUsEmail-dev'] = new DataAwsSsmParameter(this, "contactUsEmailDev",{
            name : parameterStorePrefix+"contactUsEmail-dev"
        }).value

        this._parameters['contactUsEmail-live'] = new DataAwsSsmParameter(this, "contactUsEmailLive",{
            name : parameterStorePrefix+"contactUsEmail-live"
        }).value

        this._parameters['recaptchaSiteSecret-dev'] = new DataAwsSsmParameter(this, "recaptchaSiteSecretDev",{
            name : parameterStorePrefix+"recaptchaSiteSecret-dev"
        }).value

        this._parameters['recaptchaSiteSecret-live'] = new DataAwsSsmParameter(this, "recaptchaSiteSecretLive",{
            name : parameterStorePrefix+"recaptchaSiteSecret-live"
        }).value

        this._parameters['stripeWebhookSigningSecret-dev'] = new DataAwsSsmParameter(this, "stripeWebhookSigningSecretDev",{
            name : parameterStorePrefix+"stripeWebhookSigningSecret-dev"
        }).value

        this._parameters['stripeWebhookSigningSecret-live'] = new DataAwsSsmParameter(this, "stripeWebhookSigningSecretLive",{
            name : parameterStorePrefix+"stripeWebhookSigningSecret-live"
        }).value
          
        //get acountId and add it to parameters
        const identity = new DataAwsCallerIdentity(this, "identity")
        this._parameters['accountId'] = identity.accountId
    
    }
}
