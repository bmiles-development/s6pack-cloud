import 'dotenv/config'
import { App } from "cdktf"
import { readFileSync } from 'fs'
import { parse } from 'yaml'
import { join } from 'path'

import { TFStateBackupStack } from './stacks/tfStateBackup/TFStateBackupStack' 
import { HostingStack } from './stacks/hosting/hostingStack' 
import { DataStack } from './stacks/data/dataStack' 
import { WebStack } from './stacks/web/webStack' 
import { BlueGreenToggleStack } from './stacks/blueGreenToggle/blueGreenToggleStack'
import { DocumentationStack } from './stacks/documentation/documentationStack'

// Construct the app
const app = new App();

// config yaml files
const config : any = {}
const webStacks : any = {}
const configHostingStackFile = readFileSync('./.config.hostingStack.yaml', 'utf8')
config['hostingStack'] = parse(configHostingStackFile)

const configDataStackFile = readFileSync('./.config.dataStack.yaml', 'utf8')
config['dataStack'] = parse(configDataStackFile)

const configWebStackFile = readFileSync('./.config.webStack.yaml', 'utf8')
const webStackConfig = parse(configWebStackFile)
config['webStackGreen'] = webStackConfig['webStackGreen']
config['webStackBlue'] = webStackConfig['webStackBlue']
config['webStackDev'] = webStackConfig['webStackDev']

const configblueGreenToggleStackFile = readFileSync('./.config.blueGreenToggleStack.yaml', 'utf8')
config['blueGreenToggleStack'] = parse(configblueGreenToggleStackFile)

const configDocumentationStackFile = readFileSync('./.config.documentationStack.yaml', 'utf8')
config['documentationStack'] = parse(configDocumentationStackFile)

// set up bucketname for remote TFState files managed on S3
const backendStateS3BucketName = config['hostingStack']['logBucketNamePrefix']+"-tf-state-backup-bucket";

// TFStateBackupStack 
new TFStateBackupStack(
  app,
  "tfStateBackupStack",
  backendStateS3BucketName,
  config['hostingStack'].defaultRegion,
  config['hostingStack'].useS3TfState
)

// HostingStack
// Has SSM Parameter Store, Simpe Email Service, Route53 Hosted Zone Resource and S3 for Static Webhosting
const hostingStack = new HostingStack(
  app,
  "hostingStack",
  config['hostingStack'],
  backendStateS3BucketName
);

// DataStacks
// Has Cloudwatch Logs, Cognito User Pools, Stripe Product Data, DynomoDB Tenant Data, Plus an Application for Pre and Post  
const dataStackLive = new DataStack(
  app,
  "dataStackLive",
  config['hostingStack'].hostedZone,
  hostingStack.sesResource,
  "live",
  config['dataStack'],
  config['hostingStack'].defaultRegion,
  config['hostingStack'].logRetentionPeriod,
  backendStateS3BucketName,
  join(__dirname, "stacks/data"),
  hostingStack.ssmResource.parameters["stripeToken-live"],
  hostingStack.ssmResource.parameters['recaptchaSiteSecret-live'],
  "live_free_plan",
  hostingStack.s3Resource
);
const dataStackDev = new DataStack(
  app,
  "dataStackDev",
  config['hostingStack'].hostedZone,
  hostingStack.sesResource,
  "dev",
  config['dataStack'],
  config['hostingStack'].defaultRegion,
  config['hostingStack'].logRetentionPeriod,
  backendStateS3BucketName,
  join(__dirname, "stacks/data"),
  hostingStack.ssmResource.parameters["stripeToken-dev"],
  hostingStack.ssmResource.parameters['recaptchaSiteSecret-dev'],
  "dev_free_plan",
  hostingStack.s3Resource
);

// webStacks 
webStacks[config['webStackDev'].name] = new WebStack(
  app,
  config['webStackDev'].name,
  config['hostingStack'].defaultRegion,
  config['webStackDev'],
  hostingStack,
  dataStackDev,
  config['dataStack'].stripe.trialPeriodInDays,
  join(__dirname, "stacks/web"),
  backendStateS3BucketName,
  hostingStack.ssmResource.parameters["stripeToken-dev"],
  hostingStack.ssmResource.parameters['contactUsEmail-dev'],
  "dev_free_plan",
  hostingStack.ssmResource.parameters['cloudfrontLambdaUrlAccessUuid-dev'],
);

webStacks[config['webStackGreen'].name] = new WebStack(
  app,
  config['webStackGreen'].name,
  config['hostingStack'].defaultRegion,
  config['webStackGreen'],
  hostingStack,
  dataStackLive,
  config['dataStack'].stripe.trialPeriodInDays,
  join(__dirname, "stacks/web"),
  backendStateS3BucketName,
  hostingStack.ssmResource.parameters["stripeToken-live"],
  hostingStack.ssmResource.parameters["contactUsEmail-live"],
  "live_free_plan",
  hostingStack.ssmResource.parameters['cloudfrontLambdaUrlAccessUuid-live'],
);

webStacks[config['webStackBlue'].name] = new WebStack(
  app,
  config['webStackBlue'].name,
  config['hostingStack'].defaultRegion,
  config['webStackBlue'],
  hostingStack,
  dataStackLive,
  config['dataStack'].stripe.trialPeriodInDays,
  join(__dirname, "stacks/web"),
  backendStateS3BucketName,
  hostingStack.ssmResource.parameters["stripeToken-live"],
  hostingStack.ssmResource.parameters["contactUsEmail-live"],
  "live_free_plan",
  hostingStack.ssmResource.parameters['cloudfrontLambdaUrlAccessUuid-live'],
);

////the blueGreenToggleStack is infrastructure for simplifying Blue/Green domain name switching via the config['hostingStack'].currentLiveStack setting
 const currentLiveAppStackName = config['blueGreenToggleStack'].currentLiveAppStackName


 // DocumentationStack
// Simple wewbhosting stack for hosting a documentation site on S3.
new DocumentationStack(
  app,
  "documentationStack",
  config['hostingStack'].defaultRegion,
  config['documentationStack'],
  hostingStack,
  backendStateS3BucketName,
);


new BlueGreenToggleStack(
  app,
  "blueGreenToggleStack",
  hostingStack.hostedZoneResource.zone.id,
  hostingStack.acmResource.certificates["appsyncSslCert"].arn,
  hostingStack.s3Resource.s3CloudfrontLoggingBucket.bucketDomainName,
  webStacks[currentLiveAppStackName], // need to pass in all togglable stacks to avoid cross-stack sync errors when deploying
  config['hostingStack'].defaultRegion,
  config['hostingStack'].graphqlApiUrl,
  config['hostingStack'].hostedZone,
  backendStateS3BucketName,
  config['dataStack'].stripe['webhookEndpointSubdomain-live']
)


app.synth();
