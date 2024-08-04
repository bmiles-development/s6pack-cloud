/* istanbul ignore file */
import path from "path";
import fs from "fs";
import yaml from "js-yaml";
const pwd = process.cwd();
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { Auth } from "aws-amplify";
import {
  AdminConfirmSignUpCommand,
  AdminAddUserToGroupCommand,
  SignUpCommand,
  AdminSetUserPasswordCommand,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { createAuthLink } from "aws-appsync-auth-link";
import { createSubscriptionHandshakeLink } from "aws-appsync-subscription-link";
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
} from "@apollo/client";
import WebSocket from "ws";

//Cant use stripe.js Elements serverside so fake Elements here
export async function ConfirmSetupIntent(
  clientSecret: string,
  stripe: any,
  paymentMethod = "pm_card_visa"
) {
  const splitSetupIntent = await clientSecret.split("_secret");
  const setupIntent = await stripe.setupIntents.retrieve(splitSetupIntent[0]);
  expect(setupIntent.id).toBeDefined();
  return await stripe.setupIntents.confirm(setupIntent.id, {
    payment_method: paymentMethod,
  });
}

export async function CreatePaymentMethod(
  stripe,
  testCard = {
    number: "4242424242424242",
    exp_month: 8,
    exp_year: 2026,
    cvc: "314",
  }
) {
  return await stripe.paymentMethods.create({
    type: "card",
    card: testCard,
  });
}

export async function CheckIfTestUserExists(configVars, cognito) {
  try {
    const userExistsParams = {
      AttributesToGet: ["email", "sub"],
      Filter: '"email"^="' + configVars.testUsername + '"',
      Limit: 1,
      UserPoolId: configVars.testUserPoolId,
    };
    const checkUser = await cognito.send(
      new ListUsersCommand(userExistsParams)
    );
    if (checkUser.Users.length > 0) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    console.log(e);
    return false;
  }
}

export async function GetConfigVars(Amplify) {
  let configVars: any;
  const yamlFilePath = path.join(pwd, "..", "config.hostingStack.yaml");
  try {
    configVars = yaml.load(fs.readFileSync(yamlFilePath, "utf8"));
  } catch (e) {
    throw new Error(`Unable to load config.hostingStack.yaml: ${e.message}`);
  }

  const ssm = new SSMClient({ region: configVars.defaultRegion });
  const parameterNames = [
    "testUsername",
    "testPassword",
    "testUserPoolId",
    "stripeToken-dev",
    "testCognitoClientId",
    "testFreeTrialPlanId",
    "testPaidPlanId",
    "testFreePlanId",
    "testIdentityPoolId",
    "testUserPoolWebClientId",
    "testEmailAddressForTestingResponses",
  ];

  for (let paramName of parameterNames) {
    try {
      const response = await ssm.send(
        new GetParameterCommand({
          Name: configVars.parameterStorePrefix + paramName,
          WithDecryption: true,
        })
      );
      if (response && response.Parameter && response.Parameter.Value) {
        configVars[paramName] = response.Parameter.Value;
      }
    } catch (e) {
      console.error(`Unable to fetch ${paramName} from SSM: ${e.message}`);
    }
  }

  global.WebSocket = WebSocket;

  Amplify.configure({
    Auth: {
      identityPoolId: configVars.testIdentityPoolId,
      region: configVars.defaultRegion,
      identityPoolRegion: configVars.defaultRegion,
      userPoolId: configVars.testUserPoolId,
      userPoolWebClientId: configVars.testUserPoolWebClientId,
      mandatorySignIn: false,
      signUpVerificationMethod: "code",
      authenticationFlowType: "USER_PASSWORD_AUTH",
    },
    API: {
      //ID Token Workaround: https://github.com/aws-amplify/amplify-swift/issues/780
      graphql_headers: async () => {
        try {
          const session = await Auth.currentSession();
          return {
            Authorization: session.getIdToken().getJwtToken(),
          };
        } catch (e) {
          //console.log(e);
        }
      },
    },
    aws_appsync_graphqlEndpoint: configVars.testGraphQlEndpoint,
    aws_appsync_authenticationType: "AMAZON_COGNITO_USER_POOLS",
    aws_appsync_region: configVars.defaultRegion,
  });

  const url = configVars.testGraphQlEndpoint;
  const region = configVars.defaultRegion;
  const auth = {
    type: "AMAZON_COGNITO_USER_POOLS",
    //apiKey: appSyncConfig.aws_appsync_apiKey,
    jwtToken: async () => {
      try {
        const session = await Auth.currentSession();
        return session.getIdToken().getJwtToken();
      } catch (e) {
        console.log(e);
      }
    },
  };
  const httpLink = new HttpLink({ uri: url });
  const link = ApolloLink.from([
    createAuthLink({ url, region, auth }),
    createSubscriptionHandshakeLink({ url, region, auth }, httpLink),
  ]);
  configVars["apolloClient"] = new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });

  return configVars;
}

export async function CognitoCreateTestUser(configVars, cognito) {
  const signUpParams = {
    ClientId: configVars.testCognitoClientId,
    Username: configVars.testUsername,
    Password: configVars.testPassword,
    UserAttributes: [
      {
        Name: "email",
        Value: configVars.testUsername,
      },
      {
        Name: "name",
        Value: "e9a9f67c-8a72-498e-a097-c9cb8e922b94",
      },
    ],
  };

  try {
    const signUpResponse = await cognito.send(new SignUpCommand(signUpParams));

    // Confirming user sign-up
    const confirmSignUpParams = {
      UserPoolId: configVars.testUserPoolId,
      Username: configVars.testUsername,
    };
    await cognito.send(new AdminConfirmSignUpCommand(confirmSignUpParams));

    // Setting the user's password
    const setPasswordParams = {
      UserPoolId: configVars.testUserPoolId,
      Username: configVars.testUsername,
      Password: configVars.testPassword,
      Permanent: true,
    };
    await cognito.send(new AdminSetUserPasswordCommand(setPasswordParams));

    // Adding user to the "Free" group
    const addToGroupParams = {
      UserPoolId: configVars.testUserPoolId,
      Username: configVars.testUsername,
      GroupName: "Free",
    };
    await cognito.send(new AdminAddUserToGroupCommand(addToGroupParams));
  } catch (err) {
    console.log(`Error in cognitoCreateTestUser: ${err.message}`);
  }
}

export async function FakeCognitoPasswordVerification(
  cognito: any,
  testUser: string,
  userPoolId: string,
  password: string
) {
  //set user password, simulate coginto login
  const setUserPasswordParams = {
    UserPoolId: userPoolId, // Replace with your Cognito User Pool ID
    Password: password,
    Username: testUser,
    Permanent: true,
  };
  await cognito.send(new AdminSetUserPasswordCommand(setUserPasswordParams));
}

export async function DynamoBDUpdateTimestamp(
  defaultRegion: string,
  timestamp: number,
  tenantId: string
) {
  const client = new DynamoDBClient({ region: defaultRegion });
  const input = {
    ExpressionAttributeNames: {
      "#AT": "TrialPeriodTimestamp",
    },
    ExpressionAttributeValues: {
      ":t": {
        N: String(timestamp),
      },
    },
    Key: {
      Id: {
        S: tenantId,
      },
    },
    TableName: "dataStackDev-Tenants",
    UpdateExpression: "SET #AT = :t",
  };

  const command = new UpdateItemCommand(input);
  const response = await client.send(command);
  return response;
}

export async function StripeFastForwardCanceledAt(
  stripe,
  timestamp: number,
  customerId: string
) {
  //const customer = await stripe.customers.retrieve(customerId);
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 3,
  });
    await stripe.subscriptions.update(subscriptions.data[0].id, {
    cancel_at: timestamp
  });
  return await stripe.subscriptions.update(subscriptions.data[0].id, {
    cancel_at_period_end: true
  });
}

export async function DynamoBDFastForwardCancelPlanAt(
  defaultRegion: string,
  timestamp: number,
  tenantId: string
) {
  const client = new DynamoDBClient({ region: defaultRegion });
  const input = {
    ExpressionAttributeNames: {
      "#AT": "CancelPlanAt",
    },
    ExpressionAttributeValues: {
      ":t": {
        N: String(timestamp),
      },
    },
    Key: {
      Id: {
        S: tenantId,
      },
    },
    TableName: "dataStackDev-Tenants",
    UpdateExpression: "SET #AT = :t",
  };

  const command = new UpdateItemCommand(input);
  const response = await client.send(command);
  return response;
}

export async function DynamoGetTenantWithProcessorCustomerId(
  defaultRegion: string,
  tenantId: string
) {
  const client = new DynamoDBClient({ region: defaultRegion });
  const input = {
    Key: {
      Id: {
        S: tenantId,
      },
    },
    TableName: "dataStackDev-Tenants",
  };

  const command = new GetItemCommand(input);
  const response = await client.send(command);
  return response;
}
