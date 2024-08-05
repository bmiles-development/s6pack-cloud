

# Requirements
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
 3) Create AWS [SSM Parameter Store](https://us-east-1.console.aws.amazon.com/systems-manager/parameters) for the first section of parameters outlined in the config.hostingStack.yaml comments.Modify the parameters in the following config files to match your application: config.hostingStack.yaml, config.dataStack.yaml and config.webStack.yaml
 4) Install AWS, Stripe and dependant CDKTF providers. run ```cdktf get``` to install the providers.
 5) run ```cdktf deploy tfStateBackupStack --auto-approve``` this will setup the state store on S3 instead of on your local machine. This is for a bunch of good reasons, including better security and avoiding syncing issues when developing with a team.
 6) TODO might have to comment out the S3Backend function first before initially run- see the chicken or the egg problem with remote backend infrastructure in the same project.
 7) run: ```cdktf deploy hostingStack --auto-approve``` follow DNS instructions in the TerraformOutput (copy the Hosted Zone SN records into your domain name host DNS, if you do not do this the next stack deployment will fail)
 8) run ```cdktf deploy dataStackLive dataStackDev --auto-approve --ignore-missing-stack-dependencies```
 9) run ```cdktf deploy webStackBlue webStackGreen webStackDev --auto-approve --ignore-missing-stack-dependencies``` 
 10) run ```cdktf deploy blueGreenToggleStack --auto-approve --ignore-missing-stack-dependencies```
 11) if you toggle your blue/green stack, just running: ```cdktf deploy blueGreenToggleStack --auto-approve --ignore-missing-stack-dependencies``` may give you cross-stack-output errors, so just deploy the stack you are toggling to and it will update the cross-stack-output data and then NOT throw an error.  


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

## Example Application Test Setup in the clupd folder
    1) run npm update in the stacks/web/app/tests folder.
    2) email stripe support as indicated this error message here (if you try to run any payment tests you will see this error message):  ```Sending credit card numbers directly to the Stripe API is generally unsafe. We suggest you use test tokens that map to the test card you are using, see https://stripe.com/docs/testing. To enable raw card data APIs in test mode, see https://support.stripe.com/questions/enabling-access-to-raw-card-data-apis.```

## Create Test User Manually 
    Simplest is to create one using the s6pack client, but it may be necessary to create a user from the AWS admin interface (for example, if you would like to use a username/email address that is not real, like test@test.com) you can do it with the following steps:
        1) Create a cognito user (username is an email address) and add a password.
        2) edit the user andd add the email again in the email field (same as the username) and check the box mark as verified
        3) add another attribute "name", and  enter a UUID (eg: "e9a9f67c-8a72-498e-a097-c9cb8e922b94")
        4) add the user to the appropriate group
        5) go to the Appsync admin and use the app associated with the user pool (eg Dev)
        6) go the the queries page and log in to user pools, it will have you reset the password
##

Run Tests
```npm test```

Run Specific Test
```npm test -- -t stacks/web/app/tests/user.test.ts 'test name here' ```


## Lambda Layers
How to creat new node.js Lambda Layers:
https://dev.to/afrazkhan/how-to-setup-aws-lambda-layers-nodejs-182


1) ```npm init -i```
2) ```npm i {package_names}```
3)  add this snippet to package.json ```"scripts": {
        "build": "npm install && mkdir -p nodejs && cp -r node_modules nodejs/ && zip -r  {file-name}.zip nodejs"
    }```
4) ```npm run build```


# Upgrading
1) adjust package.json (cdktf, @cdktf/provider-*, @types/node) to latest versions then in root folder and run ```npm update```
2) run ```npm list -g``` to get a list of global npm packages and for each module in question (aws-cdk, cdktf-cli) run ```sudo npm install -g <module-name>```
3)```deploy``` the stack. If delpying fails, then:
4) For each stack, you may need to upgrade each stack in the folder ```cdktf.out/stacks``` with ```cd cdktf.out/stacks/$nameofstack``` by running ```terraform init -upgrade```

# Update notes for serverless v2
npm update
sudo npm install cdktf-cli@0.13.0 -g
cdktf provider add "aws@~>4.14" null kreuzwerker/docker archive
cdktf get
npm i -D @types/node //run this if main.ts cant find 'fs' or 'path'
when you run cdktf deploy, it will prompt you to ```terraform init -upgrade``` for each stack (see Upgrading section above, step 3)

# Issues and Solutions

```cdktf destroy webStackGreen webStackBlue webStackDev``` causes error with Appsync: "Error: error deleting Appsync Domain Name "<domain_name_here>": BadRequestException: Domain name must be disassociated before it can be deleted." Known issue here https://github.com/hashicorp/terraform-provider-aws/issues/25322. 

```cdktf destroy hostingStack``` causes error with stripe products not deleting. Since the Stripe API does not have a delete endpoint the products have to be manually deleted in the Stripe admin panel. The relevant objects in the terraform.hostingStack.state file needs to be deleted as well, or the ```cdktf destroy hostingStack``` command will continue to fail.

## Resource tracking fails when manually deleting resources
The easiest way to no longer track resources that have been manually deleted is to simply delete the resources in the .tfstate and .tfstate.backup files. There are commands to do this but this way seems easier especially for multiple resources (like Stripe prices)
