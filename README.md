

# Requirements
* Domain Name
* npm
* [CDKTF](https://learn.hashicorp.com/tutorials/terraform/cdktf-install)
* An Amazon AWS account with a ~/.aws [configuration and credential file settings](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
* A [hostedZone in Route53](https://us-east-1.console.aws.amazon.com/route53/v2/hostedzones) on AWS 
* a Stripe Account with [api key](https://stripe.com/docs/development/get-started#initial-setup)
* Google [Recaptcha key](https://www.google.com/recaptcha/admin/site)

Full deployment time will take roughly an hour with manual steps between (required for most error free/seamless experience)
    
# Installation
 1) clone the project ```git clone git@github.com:bmiles-development/s6pack-cloud.git``` and cd into the project diractory.
 2) run ```npm update```
 3) Install AWS, Stripe and dependant CDKTF providers. run ```cdktf get``` to install the providers.
 4) Copy and rename the following files:
    ```
		.config.blueGreenToggleStack.yaml.template -> .config.blueGreenToggleStack.yaml
		.config.dataStack.yaml.template -> .config.dataStack.yaml
		.config.hostingStack.yaml.template -> .config.hostingStack.yaml
		.config.webStack.yaml.template -> .config.webStack.yaml
    ```
 5) run ```cdktf deploy tfStateBackupStack --auto-approve``` this stack's purpose is to setup the Terraform state store on S3 instead of on your local machine. This is for a bunch of good reasons, including better security and avoiding syncing issues when developing with a team.
 6) In your ```.config.hostingStack.yaml``` file, change the ```useS3TfState``` value to true. 
 7) run ```cd cdktf.out/stacks/tfStateBackupStack && terraform init -migrate-state``` then answer ```yes``` at the prompt
 8) run ```cd ../../../```
 9) run ```cdktf deploy tfStateBackupStack --auto-approve```. This is necessary to work around the chicken-or-the-egg problem of storing the tfStateBackupStack.tfState files on the tfStateBackupStack itself.
 10) Create AWS [SSM Parameter Store] ```SecureString``` Parameters(https://us-east-1.console.aws.amazon.com/systems-manager/parameters) for each of the following parameters:
    
    Dummy email address if response is not necessary
    ```
    /global/parameters/testUsername = "test@test.com" 
    ```
    ```
    /global/parameters/contactUsEmail-dev = "testp+contactUsTest@test.com"
    ```
    ```
    /global/parameters/contactUsEmail-live = "test+production@test.com"
    ```
    ```
    /global/parameters/testPassword = "R123xyz123-!"
    ```
    Google Recaptcha secret key see: https://blog.logrocket.com/implement-recaptcha-react-application/ , or just create an account here https://www.google.com/recaptcha/admin/create .

    ```
    /global/parameters/recaptchaSiteSecret-live = 6Lxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    ```
    For localhost captcha testing see: https://developers.google.com/recaptcha/docs/faq#id-like-to-run-automated-tests-with-recaptcha.-what-should-i-do
    ```
    /global/parameters/recaptchaSiteSecret-dev = 6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe

    ```
    Free plan id, can leave as is or can be customizable (eg: Free Plan see config.dataStack.yaml)
    ```
    /global/parameters/testFreeTrialPlanIdId = "dev_business_plan" 
    ```
    Paid plan id (eg: Pro Plan see config.dataStack.yaml)
    ```
    /global/parameters/testPaidPlanId = "pro_plan"
    ```
    free trial plan id (eg: Business Plan, see config.dataStack.yaml)
    ```
    /global/parameters/testFreeTrialPlanId = "business_plan" 
    
    ```
 11) create emplty values for these parameters for now, we will poplulate them later once they have been created:
        ```
        /global/parameters/stripeToken-dev = " " 
        /global/parameters/stripeToken-live = " "
        /global/parameters/stripeWebhookSigningSecret-dev = " "
        /global/parameters/stripeWebhookSigningSecret-live = " " 
        /global/parameters/testUserPoolId = " "
        /global/parameters/testCognitoClientId = " "
        /global/parameters/testIdentityPoolId = " "
        ```
 12) run: ```cdktf deploy hostingStack --auto-approve``` follow DNS instructions in the TerraformOutput under "rout53HostedZone". You will see it at the end of the cli output in the terminal when the deployment has successfully complete. (copy the Hosted Zone SN records into your domain name host DNS, if you do not do this the next stack deployment will fail). 
    
        ** You may get an error regarding S3 ACL permissions Just try to deploy the hosting stack again after a minute or two since  deployment timing on AWS can be out of sync. 

        ** If you get an error "from Amazon SES when attempting to send email", you may have Amazon SES identity status verification pending. This verification may take up to an hour. Check verification status here (verify your region in the url): https://us-west-1.console.aws.amazon.com/ses/home?region=us-west-1#/identities
 13) Before deploying the dataStacks, you need to complete the business profile in the [Stripe Dashboard](https://dashboard.stripe.com/). Otherwise, the terraform commands will not have access to the live site, only the sandbox site and you will get errors. The only way to fix the errors is to cd into the cdktf.out/stacks/{your stack in question} and run these commands to pull, edit the state file directly (remove the json block in question) and push. See: https://developer.hashicorp.com/terraform/cli/commands/state/push
 14) run ```cdktf deploy dataStackDev --auto-approve --ignore-missing-stack-dependencies```
 15) After deployment has completed, populate the following Parameter Store parameters from step 10 using the TerraformOutput displayed in the terminal:
    The following will be listed under the dataStackDev TerraformOutput:
        In the terminal, look for dataStackDev Outputs: dataStackDev_CognitoClientId_XXXXXX = "value-to-copy-here" and copy the value to this parameter:
        ```
        /global/parameters/testCognitoClientId = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        ```
        the value for dataStackDev_IdentityPoolId_XXXXXX goes here:
        ```
        /global/parameters/testIdentityPoolId = "{region-name}:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        ```
        the value for dataStackDev_UserPoolId_XXXXXX goes here:
        ```
        /global/parameters/testUserPoolId = "{region-name}_xxxxxxxxx"
        ```


 14) run ```cdktf deploy dataStackLive --auto-approve --ignore-missing-stack-dependencies```

        
        Once Deployment is complete, find the stripe api tokens here: https://dashboard.stripe.com/test/apikeys . Toggle Test Mode to "on" to get the dev token and populate the parameters below in Parameter Store:
        ```
        /global/parameters/stripeToken-dev = "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
        ```
        Toggle Test Mode to "off" to get the live token (if you do not have live mode set up yet, you can use the test key here also):
        ```
        /global/parameters/stripeToken-live = "sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
        ```
        Goto your stripe webhooks here : https://dashboard.stripe.com/test/webhooks/ click the https://webhookdev.yourdomain and look for the "signing secret" and click "Reveal". enter that value in the parameter:
        ```
        /global/parameters/stripeWebhookSigningSecret-dev = "whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        ```
        if you do not have live mode set up yet, you can use the test key here as well
        ```
        /global/parameters/stripeWebhookSigningSecret-live = "whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
        ```

   
 15) You will receive an email sent to the address defined in the config.HostingStack.yaml under the parameters: ```sesEmailIdentityAddress``` and ```sesEmailIdentityDomain```. These values need to be an email address that is accessable so that you can click the link in that email to verify the email identity. This can be an email from a different domain (eg: eg@gmail.com). This is so that you can send emails from SES to anyone outside of the hostedZone. Look for the email subjkect line: ```Amazon Web Services – Email Address Verification Request```
 16) You can now request to SES production access to AWS [here](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html?icmpid=docs_ses_console). This will allow you to send emails unrestricted. 
 17) run ```cdktf deploy webStackDev --auto-approve --ignore-missing-stack-dependencies``` 
 18) run ```cdktf deploy webStackBlue webStackGreen --auto-approve --ignore-missing-stack-dependencies```
 19) run ```cdktf deploy blueGreenToggleStack --auto-approve --ignore-missing-stack-dependencies```
 20) if you toggle your blue/green stack, just running: ```cdktf deploy blueGreenToggleStack --auto-approve --ignore-missing-stack-dependencies``` may give you cross-stack-output errors, so just deploy the stack you are toggling to (eg: if blue then deploy webStackBlue first) and it will update the cross-stack-output data and then NOT throw an error.  


# Possible Deployment Issues
Running the installation commands above reduce fatal errors related to service start up timing. Sometimes a service depends on another and it may not be ready yet. If an error does occur, simply wait a few minutes and run the command again and it should work. Most errors have been reported in the cdktf github repo. Below is a list of known errors:
- hostingStack: SES Error: Error setting MAIL FROM domain: InvalidParameterValue: Identity <identity_here> does not exist.
    SES identity is still creating, wait a minute and run the deploy command again,=.
- blue/green/devStack: AWS/ACM Error: error creating Appsync Domain Name: BadRequestException: Certificate is invalid
    Certificate is waiting to be issued. Wait a few minutes ant deploy again.
- blue/green/devStack,finalizationStack: Appsync Error: error creating Appsync Domain Name API Association: NotFoundException: Domain name not found.
    Appsync Custom Domain Name is still creating. Wait 5 or so minutes and try again.

# Post Deployment setup requirements
"Request SES Production Access" from your SES Account Dashboard Page and/or add any test email addresses to the "verified identities" page. (see app/tests/user_test.go for updating email addresses to verified email addresses). Otherwise addAdminUser and addStandardUser unit tests will fail
    
# env vars
If you encounter memory errors when deploying using Terraform, runt this:
```export NODE_OPTIONS="--max-old-space-size=8192"```

# Multiple deployments
within main.ts you can see how multiple deployments can be created with seperate config files for each. This is useful for setting up development/production environments. It is defaulted to the "Blue/Green" developlent strategy, but symply changing the config yaml file names and variable names you can achieve essentially any development/production environment strategy.

# Tests

## Step Function Local Testing Setup
    https://docs.aws.amazon.com/step-functions/latest/dg/sfn-local-docker.html
    1) docker pull amazon/aws-stepfunctions-local
    2) docker run -p 8083:8083 amazon/aws-stepfunctions-local

## Example Application Test Setup in the cloud folder
    1) run npm update in the ./tests folder.
    2) Run Tests 
        ```npm test```
    3) Run Specific Test
        ```npm test -- -t stacks/web/app/tests/user.test.ts 'test name here' ```

## Lambda Layers
How to creat new node.js Lambda Layers:
https://dev.to/afrazkhan/how-to-setup-aws-lambda-layers-nodejs-182
    1) ```npm init -i```
    2) ```npm i {package_names}```
    3) add this snippet to package.json ```"scripts": {
        "build": "npm install && mkdir -p nodejs && cp -r node_modules nodejs/ && zip -r  {file-name}.zip nodejs"
    }```
    4)```npm run build```


# Upgrading
    1) adjust package.json (cdktf, @cdktf/provider-*, @types/node) to latest versions then in root folder and run ```npm update```
    2) run ```npm list -g``` to get a list of global npm packages and for each module in question (aws-cdk, cdktf-cli) run ```sudo npm install -g <module-name>```
    3) ```deploy``` the stack. If delpying fails, then:
    4) For each stack, you may need to upgrade each stack in the folder ```cdktf.out/stacks``` with ```cd cdktf.out/stacks/$nameofstack``` by running ```terraform init -upgrade```

# Update notes for serverless v2
npm update
sudo npm install cdktf-cli@0.13.0 -g
cdktf provider add "aws@~>4.14" null kreuzwerker/docker archive
cdktf get
npm i -D @types/node //run this if main.ts cant find 'fs' or 'path'
when you run cdktf deploy, it will prompt you to ```terraform init -upgrade``` for each stack (see Upgrading section above, step 3)

# Potential Issues and Solutions

```cdktf destroy webStackGreen webStackBlue webStackDev``` causes error with Appsync: "Error: error deleting Appsync Domain Name "<domain_name_here>": BadRequestException: Domain name must be disassociated before it can be deleted." Known issue here https://github.com/hashicorp/terraform-provider-aws/issues/25322. 

```cdktf destroy hostingStack``` causes error with stripe products not deleting. Since the Stripe API does not have a delete endpoint the products have to be manually deleted in the Stripe admin panel. The relevant objects in the terraform.hostingStack.state file needs to be deleted as well, or the ```cdktf destroy hostingStack``` command will continue to fail.

## Resource tracking fails when manually deleting resources
The easiest way to no longer track resources that have been manually deleted is to simply delete the resources in the .tfstate and .tfstate.backup files. There are commands to do this but this way seems easier especially for multiple resources (like Stripe prices)
