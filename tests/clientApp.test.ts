import {
  CognitoCreateTestUser,
  GetConfigVars,
  CheckIfTestUserExists,
  FakeCognitoPasswordVerification,
  CreatePaymentMethod,
  DynamoBDUpdateTimestamp,
  DynamoBDFastForwardCancelPlanAt,
  StripeFastForwardCanceledAt,
  DynamoGetTenantWithProcessorCustomerId,
} from "./clientApp.mock";
import { Amplify, API, graphqlOperation, Auth } from "aws-amplify";
import { GRAPHQL_AUTH_MODE } from "@aws-amplify/api";

import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import {
  listPlans,
  listUsers,
  listPaymentMethods,
  checkout,
  getTenantTrialPeriod,
  getUpcomingInvoice,
  getTenant,
} from "./exampleClientApp/graphql/queries";
import {
  activateUser,
  deactivateUser,
  deletePaymentMethod,
  contactUs,
  setDefaultPaymentMethod,
  enableDeleteAccount,
  disableDeleteAccount,
  createPlanIntent,
  addStandardUser,
  addAdminUser,
  changeStandardUserToAdmin,
  changeAdminToStandardUser,
  deleteAccount,
  deleteStandardUser,
  deleteAdminUser,
  changePlan,
  cancelPaidPlan,
  confirmAddPlan,
  confirmAddPaymentMethod,
  createPaymentMethodIntent,
  reactivateCancelingPaidPlan,
  cancelPaidPlanAtPeriodEnd,
} from "./exampleClientApp/graphql/mutations";
import {
  planModified,
  planCanceled,
} from "./exampleClientApp/graphql/subscriptions";
import gql from "graphql-tag";
import util from "util";
import WebSocket from "ws";

let configVars: any;
let cognito: any;
let stripe: any;
let testUserExists: any;


describe("basic unauthorized calls using GRAPHQL_AUTH_MODE.AWS_IAM", () => {
  beforeAll(async () => {
    configVars = await GetConfigVars(Amplify);
    await Auth.currentCredentials();
    return true;
  }, 10000);

  afterAll(async () => {
    await Auth.signOut();
    return true;
  }, 10000);

  test("listPlans should return data", async () => {
    const response: any = await API.graphql({
      query: listPlans,
      variables: {},
      authMode: GRAPHQL_AUTH_MODE.AWS_IAM,
    });
    expect(response.data).toBeDefined();
  });

  test("listUsers should not return data", async () => {
    let e: any;
    try {
      await API.graphql({
        query: listUsers,
        variables: {},
        authMode: GRAPHQL_AUTH_MODE.AWS_IAM,
      });
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].message).toMatch("Request failed with status code 401");
  });

  test("contactUs form should email response", async () => {
    await API.graphql({
      query: contactUs,
      variables: {
        input: {
          captchaToken: "erghrew",
          email: configVars["contactUsEmail-dev"],
          message: "unauth success",
          subject: "test unauth contact",
        },
      },
      authMode: GRAPHQL_AUTH_MODE.AWS_IAM,
    });
  });
});

describe("basic authorized calls using GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS", () => {
  beforeAll(async () => {
    cognito = new CognitoIdentityProviderClient();
    configVars = await GetConfigVars(Amplify);
    await CognitoCreateTestUser(configVars, cognito);
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    return true;
  }, 20000);

  afterAll(async () => {
    await Auth.signOut();
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    //user deleted in tests
    return true;
  }, 20000);

  test("listPlans should return data", async () => {
    const response: any = await API.graphql(graphqlOperation(listPlans));
    expect(response.data).toBeDefined();
  });

  test("contactUs form should email response- check email", async () => {
    let messageResults: any = await API.graphql({
      query: contactUs,
      variables: {
        input: {
          captchaToken: "erghrew",
          email: configVars["contactUsEmail-dev"],
          message: "auth success",
          subject: "test",
        },
      },
    });
    expect(messageResults.data.contactUs).toBeDefined();
  });

  test("delete userpool test user account", async () => {
    await API.graphql({
      query: enableDeleteAccount,
    });
    const deleteAccountData: any = await API.graphql(
      graphqlOperation(deleteAccount)
    );
    expect(deleteAccountData.data.deleteAccount.success).toBeDefined();
  });
});

describe("create user, upgrade plan to free plan, delete account", () => {
  let setupIntentData: any;
  let users = {};

  beforeAll(async () => {
    cognito = new CognitoIdentityProviderClient();
    configVars = await GetConfigVars(Amplify);
    stripe = require("stripe")(configVars["stripeToken-dev"]);
    //check if user exists
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (!testUserExists) {
      await CognitoCreateTestUser(configVars, cognito);
    }
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    return true;
  }, 20000);

  afterAll(async () => {
    await Auth.signOut();
    return true;
  }, 20000);

  test("fail add user to free trial plan", async () => {
    let e: any;
    try {
      const splitEmail =
        configVars["contactUsEmail-dev"].split("@");
      const testUser2 = splitEmail[0] + "+2@" + splitEmail[1];

      await API.graphql({
        query: addStandardUser,
        variables: { username: testUser2 },
      });
      // ... Other assertions here
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch("Unauthorized");
  });

  test("setup trial period plan setup intent and confirm it", async () => {
    setupIntentData = await API.graphql(
      graphqlOperation(createPlanIntent, {
        planId: configVars.testFreeTrialPlanId,
      })
    );
    expect(setupIntentData.data.createPlanIntent.clientSecret).toBeDefined();

    // use stripe.js stripe.createPaymentMethod in actual frontend
    const newPaymentMethod = await CreatePaymentMethod(stripe);
    const confirmAddPlanData: any = await API.graphql(
      graphqlOperation(confirmAddPlan, {
        paymentMethodId: newPaymentMethod.id,
        planId: configVars.testFreeTrialPlanId,
        setupIntentClientSecret:
          setupIntentData.data.createPlanIntent.clientSecret,
      })
    );
    expect(confirmAddPlanData.data.confirmAddPlan.id).toBeDefined();
  }, 60000);
/*
  test("add standard user", async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser2 = splitEmail[0] + "+2@" + splitEmail[1];
    const response: any = await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser2 })
    );
    expect(response.data.addStandardUser.id).toBeDefined();
  });

  test("delete standard user", async () => {
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser2 = splitEmail[0] + "+2@" + splitEmail[1];
    const response: any = await API.graphql(
      graphqlOperation(deleteStandardUser, { id: testUser2 })
    );
    expect(response.data.deleteStandardUser.id).toBeDefined();
  });

  test("add admin user", async () => {
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser3 = splitEmail[0] + "+3@" + splitEmail[1];
    const response: any = await API.graphql(
      graphqlOperation(addAdminUser, { username: testUser3 })
    );
    expect(response.data.addAdminUser.id).toBeDefined();
  });

  test("fail add admin duplicate user", async () => {
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser3 = splitEmail[0] + "+3@" + splitEmail[1];
    let e: any;
    try {
      await API.graphql(
        graphqlOperation(addAdminUser, { username: testUser3 })
      );
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch(
      "CognitoIdentityProvider.UsernameExistsException"
    );
  });

  test("delete admin user", async () => {
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser3 = splitEmail[0] + "+3@" + splitEmail[1];
    const response: any = await API.graphql(
      graphqlOperation(deleteAdminUser, { id: testUser3 })
    );
    expect(response.data.deleteAdminUser.id).toBeDefined();
  });

  test("fail - add more standard users and max out 5 user plan limit", async () => {
    let e: any;
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser2 = splitEmail[0] + "+2@" + splitEmail[1];
    const testUser3 = splitEmail[0] + "+3@" + splitEmail[1];
    const testUser4 = splitEmail[0] + "+4@" + splitEmail[1];
    const testUser5 = splitEmail[0] + "+5@" + splitEmail[1];
    const testUser6 = splitEmail[0] + "+6@" + splitEmail[1];
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser2 })
    );
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser3 })
    );
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser4 })
    );
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser5 })
    );
    try {
      await delay(5000)// great, more Step Function Coginto-DeleteUser delay, lets compensate for it here.
      let data = await API.graphql(
        graphqlOperation(addStandardUser, { username: testUser6 })
      );
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch("PlanUserLimitReached");
  },10000);

  test("fail delete user account, must set deleteAccoutFlag to true", async () => {
    let e: any;
    try {
      await API.graphql(graphqlOperation(deleteAccount));
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch("FailDeleteAccountFlagNotSet");
  });

  test("add deleteAccountFlag", async () => {
    const response: any = await API.graphql({
      query: enableDeleteAccount,
    });
    expect(response.data.enableDeleteAccount.success).toBeTruthy();
  });

  test("remove deleteAccountFlag", async () => {
    const response: any = await API.graphql({
      query: disableDeleteAccount,
    });
    expect(response.data.disableDeleteAccount.success).toBeTruthy();
  });

  test("delete user account", async () => {
    await API.graphql({
      query: enableDeleteAccount,
    });
    const deleteAccountData: any = await API.graphql(
      graphqlOperation(deleteAccount)
    );
    expect(deleteAccountData.data.deleteAccount.success).toBeDefined();
  });
  */
});

describe("create new user, then create Admin User and test functionality, then change to Standard User and test its functionality", () => {
  beforeAll(async () => {
    cognito = new CognitoIdentityProviderClient();
    configVars = await GetConfigVars(Amplify);
    stripe = require("stripe")(configVars["stripeToken-dev"]);
    //check if user exists
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (!testUserExists) {
      await CognitoCreateTestUser(configVars, cognito);
    }
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    return true;
  }, 55000);

  afterAll(async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (testUserExists) {
      await API.graphql({
        query: enableDeleteAccount,
      });
      await API.graphql(graphqlOperation(deleteAccount));
    }
    await Auth.signOut();
    return true;
  }, 10000);

  test("setup data for following tests 1 - confirm setup with confirmAddPlan", async () => {
    const setupIntentData: any = await API.graphql(
      graphqlOperation(createPlanIntent, {
        planId: configVars.testFreeTrialPlanId,
      })
    );
    expect(setupIntentData.data.createPlanIntent.clientSecret).toBeDefined();

    // use stripe.js stripe.createPaymentMethod in actual frontend
    const newPaymentMethod = await CreatePaymentMethod(stripe);
    const confirmAddPlanData: any = await API.graphql(
      graphqlOperation(confirmAddPlan, {
        paymentMethodId: newPaymentMethod.id,
        planId: configVars.testFreeTrialPlanId,
        setupIntentClientSecret:
          setupIntentData.data.createPlanIntent.clientSecret,
      })
    );
    expect(confirmAddPlanData.data.confirmAddPlan.id).toBeDefined();
  }, 30000);

  test("setup data for following tests - create admin User", async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    // create admin user
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser2 = splitEmail[0] + "+2@" + splitEmail[1];
    const response: any = await API.graphql(
      graphqlOperation(addAdminUser, { username: testUser2 })
    );
    await FakeCognitoPasswordVerification(
      cognito,
      testUser2,
      configVars.testUserPoolId,
      configVars.testPassword
    );
    //sign out user
    await Auth.signOut();
    await Auth.signIn(testUser2, configVars.testPassword);
    expect(response.data.addAdminUser.id).toBeDefined();
  }, 10000);

  test("add users until plan limit has been reached", async () => {
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser3 = splitEmail[0] + "+3@" + splitEmail[1];
    const testUser4 = splitEmail[0] + "+4@" + splitEmail[1];
    const testUser5 = splitEmail[0] + "+5@" + splitEmail[1];
    const testUser6 = splitEmail[0] + "+6@" + splitEmail[1];
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser3 })
    );
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser4 })
    );
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser5 })
    );
    let e: any;
    try {
      await delay(5000)// grewat more Step Function Coginto-ListUsers delay, lets compensate for it here.
      await API.graphql(
        graphqlOperation(addStandardUser, { username: testUser6 })
      );
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch("PlanUserLimitReached");
  },10000);

  test("admin user - changeStandardUserToAdmin", async () => {
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser4 = splitEmail[0] + "+4@" + splitEmail[1];
    const response: any = await API.graphql(
      graphqlOperation(changeStandardUserToAdmin, { id: testUser4 })
    );
    expect(response.data.changeStandardUserToAdmin.id).toBeDefined();
  });

  test("fail - delete standard user on admin user", async () => {
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser4 = splitEmail[0] + "+4@" + splitEmail[1];
    let e: any;
    try {
      await API.graphql(
        graphqlOperation(deleteStandardUser, { id: testUser4 })
      );
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch("UserNotInCorrectGroup");
  });

  test("admin user - delete admin user", async () => {
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser4 = splitEmail[0] + "+4@" + splitEmail[1];
    const response: any = await API.graphql(
      graphqlOperation(deleteAdminUser, { id: testUser4 })
    );
    expect(response.data.deleteAdminUser.id).toBeDefined();
  });

  test("delete standard user", async () => {
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser3 = splitEmail[0] + "+3@" + splitEmail[1];
    const response: any = await API.graphql(
      graphqlOperation(deleteStandardUser, { id: testUser3 })
    );
    expect(response.data.deleteStandardUser.id).toBeDefined();
  });

  test("fail - add duplicate user", async () => {
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser3 = splitEmail[0] + "+2@" + splitEmail[1];
    let e: any;
    try {
      await delay(5000)// great, more Step Function Coginto-DeleteUser delay, lets compensate for it here.
      const response: any = await API.graphql(
        graphqlOperation(addStandardUser, { username: testUser3 })
      );
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch(
      "CognitoIdentityProvider.UsernameExistsException"
    );
  }, 10000);

  test("current admin user - change self to standard user", async () => {
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser2 = splitEmail[0] + "+2@" + splitEmail[1];
    const response: any = await API.graphql(
      graphqlOperation(changeAdminToStandardUser, { id: testUser2 })
    );
    expect(response.data.changeAdminToStandardUser.id).toBeDefined();
    await Auth.signOut();
    await Auth.signIn(testUser2, configVars.testPassword);
  });

  test("standard user - fail cant add user", async () => {
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser3 = splitEmail[0] + "+3@" + splitEmail[1];
    let e: any;
    try {
      const response: any = await API.graphql(
        graphqlOperation(addStandardUser, { username: testUser3 })
      );
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch("Unauthorized");
  });

  test("standard user fail - changeStandardUserToAdmin", async () => {
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser3 = splitEmail[0] + "+3@" + splitEmail[1];
    let e: any;
    try {
      const response: any = await API.graphql(
        graphqlOperation(changeStandardUserToAdmin, { id: testUser3 })
      );
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch("Unauthorized");
  });

  test("standard user - listUsers should return data", async () => {
    const response: any = await API.graphql({
      query: listUsers,
      variables: {},
      authMode: GRAPHQL_AUTH_MODE.AWS_IAM,
    });
    expect(response.data.listUsers).toHaveLength;
  });

  test("standard user contactUs form should email response - check email", async () => {
    const response: any = await API.graphql({
      query: contactUs,
      variables: {
        input: {
          captchaToken: "erghrew",
          email: configVars["contactUsEmail-dev"],
          message: "unauth success",
          subject: "test",
        },
      },
      authMode: GRAPHQL_AUTH_MODE.AWS_IAM,
    });
    expect(response.data.contactUs).toBeDefined();
  });
});

describe("tenant trial period tests", () => {
  beforeAll(async () => {
    cognito = new CognitoIdentityProviderClient();
    configVars = await GetConfigVars(Amplify);
    stripe = require("stripe")(configVars["stripeToken-dev"]);
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (!testUserExists) {
      await CognitoCreateTestUser(configVars, cognito);
    }
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    return true;
  }, 85000);

  afterAll(async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (testUserExists) {
      await API.graphql({
        query: enableDeleteAccount,
      });
      await API.graphql(graphqlOperation(deleteAccount));
    }
    await Auth.signOut();
    return true;
  }, 10000);

  test("get tenant trial period - AVAILABLE", async () => {
    const trialPeriodData: any = await API.graphql(
      graphqlOperation(getTenantTrialPeriod)
    );
    expect(trialPeriodData.data.getTenantTrialPeriod.trialPeriodStatus).toEqual(
      "AVAILABLE"
    );
  });

  test("setup data for following tests 2 - confirm setup with confirmAddPlan", async () => {
    const setupIntentData: any = await API.graphql(
      graphqlOperation(createPlanIntent, {
        planId: configVars.testFreeTrialPlanId,
      })
    );
    expect(setupIntentData.data.createPlanIntent.clientSecret).toBeDefined();

    // use stripe.js stripe.createPaymentMethod in actual frontend
    const newPaymentMethod = await CreatePaymentMethod(stripe);

    const confirmAddPlanData: any = await API.graphql(
      graphqlOperation(confirmAddPlan, {
        paymentMethodId: newPaymentMethod.id,
        planId: configVars.testFreeTrialPlanId,
        setupIntentClientSecret:
          setupIntentData.data.createPlanIntent.clientSecret,
      })
    );
    expect(confirmAddPlanData.data.confirmAddPlan.id).toBeDefined();
  }, 10000);

  test("get tenant trial period - ACTIVE", async () => {
    const trialPeriodData: any = await API.graphql(
      graphqlOperation(getTenantTrialPeriod)
    );
    expect(trialPeriodData.data.getTenantTrialPeriod.trialPeriodStatus).toEqual(
      "ACTIVE"
    );
  });

  test("fake change trial period to date in past", async () => {
    const session: any = await Auth.currentSession();
    const minusTwentyDays = Math.floor(+new Date() / 1000) - 20 * 24 * 60 * 60;

    //let customer = await stripe.customers.search({query: 'email:"'+configVars.testUsername+'"'});
    //customer = await stripe.customers.retrieve(customer.data[0].id,{'expand': ['subscriptions']})
    //const res = await stripe.subscriptions.update(customer.subscriptions.data[0].id, { trial_end: minusTwentyDays});

    const dbres = await DynamoBDUpdateTimestamp(
      configVars.defaultRegion,
      minusTwentyDays,
      session.idToken.payload.name
    );
    //console.log(dbres)
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
  }, 10000);

  test("get tenant trial period - EXPIRED", async () => {
    const trialPeriodData: any = await API.graphql(
      graphqlOperation(getTenantTrialPeriod)
    );
    expect(trialPeriodData.data.getTenantTrialPeriod.trialPeriodStatus).toEqual(
      "EXPIRED"
    );
  });
});

describe("changePlan and test graphql modified plan subscription", () => {
  beforeAll(async () => {
    cognito = new CognitoIdentityProviderClient();
    configVars = await GetConfigVars(Amplify);
    stripe = require("stripe")(configVars["stripeToken-dev"]);
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (!testUserExists) {
      await CognitoCreateTestUser(configVars, cognito);
    }
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    return true;
  }, 85000);

  afterAll(async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (testUserExists) {
      await API.graphql({
        query: enableDeleteAccount,
      });
      await API.graphql(graphqlOperation(deleteAccount));
    }
    await Auth.signOut();
    return true;
  }, 10000);

  test("setup data for following tests 2.1 - confirm setup with confirmAddPlan", async () => {
    const setupIntentData: any = await API.graphql(
      graphqlOperation(createPlanIntent, {
        planId: configVars.testFreeTrialPlanId,
      })
    );
    expect(setupIntentData.data.createPlanIntent.clientSecret).toBeDefined();

    // use stripe.js stripe.createPaymentMethod in actual frontend
    const newPaymentMethod = await CreatePaymentMethod(stripe);

    const confirmAddPlanData: any = await API.graphql(
      graphqlOperation(confirmAddPlan, {
        paymentMethodId: newPaymentMethod.id,
        planId: configVars.testFreeTrialPlanId,
        setupIntentClientSecret:
          setupIntentData.data.createPlanIntent.clientSecret,
      })
    );
    expect(confirmAddPlanData.data.confirmAddPlan.id).toBeDefined();
  }, 10000);

  test("test getUpcomingInvoice", async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    const checkoutData: any = await API.graphql({ query: getUpcomingInvoice });
    expect(checkoutData.data.getUpcomingInvoice.oldPlanTotal).toBeGreaterThan(
      0
    );
    expect(
      checkoutData.data.getUpcomingInvoice.nextInvoiceTimestamp
    ).toBeGreaterThan(0);
  });

  test("checkout paid plan preview from trial plan", async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    const checkoutData: any = await API.graphql({
      query: checkout,
      variables: { planId: configVars.testPaidPlanId },
    });
    expect(checkoutData.data.checkout.oldPlanTotal).toEqual(0);
    expect(checkoutData.data.checkout.nextInviceSubTotal).toBeGreaterThan(0);
  });

  test("confirm new paid plan changed from different plan - test planModified subscription (see console log, shoud have ...planModified fired.", async () => {
    const session: any = await Auth.currentSession();

    let id = session.idToken.payload.name;
    let planModifiedSub = await configVars.apolloClient
      .subscribe({
        query: gql(planModified),
        variables: { id: id },
      })
      .subscribe({
        next(data) {
          console.log("...changePlan planModified fired.");
          expect(data.data.planModified.id).toBeDefined();
          planModifiedSub.unsubscribe();
          return;
        },
        error(error) {
          console.log(error);
        },
      });
    expect(planModifiedSub._state).toEqual("ready");
    console.log("waiting for changePlan planModified to fire...");
    await API.graphql({
      query: changePlan,
      variables: { planId: configVars.testPaidPlanId },
    });
  }, 30000);
});

describe("deactivate and activate user", () => {
  let users = {};

  beforeAll(async () => {
    cognito = new CognitoIdentityProviderClient();
    configVars = await GetConfigVars(Amplify);
    stripe = require("stripe")(configVars["stripeToken-dev"]);
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (!testUserExists) {
      await CognitoCreateTestUser(configVars, cognito);
    }
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    return true;
  }, 85000);

  afterAll(async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (testUserExists) {
      await API.graphql({
        query: enableDeleteAccount,
      });
      await API.graphql(graphqlOperation(deleteAccount));
    }
    await Auth.signOut();
    return true;
  }, 10000);

  test("setup data for following tests 3 - confirm setup with confirmAddPlan", async () => {
    const setupIntentData: any = await API.graphql(
      graphqlOperation(createPlanIntent, {
        planId: configVars.testFreeTrialPlanId,
      })
    );
    expect(setupIntentData.data.createPlanIntent.clientSecret).toBeDefined();

    // use stripe.js stripe.createPaymentMethod in actual frontend
    const newPaymentMethod = await CreatePaymentMethod(stripe);

    const confirmAddPlanData: any = await API.graphql(
      graphqlOperation(confirmAddPlan, {
        paymentMethodId: newPaymentMethod.id,
        planId: configVars.testFreeTrialPlanId,
        setupIntentClientSecret:
          setupIntentData.data.createPlanIntent.clientSecret,
      })
    );
    expect(confirmAddPlanData.data.confirmAddPlan.id).toBeDefined();
  }, 10000);

  test("add users until plan limit has been reached", async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser2 = splitEmail[0] + "+2@" + splitEmail[1];
    const testUser3 = splitEmail[0] + "+3@" + splitEmail[1];
    const testUser4 = splitEmail[0] + "+4@" + splitEmail[1];
    const testUser5 = splitEmail[0] + "+5@" + splitEmail[1];
    const addStandardUserData: any = await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser2 })
    );
    users["testUser2"] = addStandardUserData.data.addStandardUser;
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser3 })
    );
    users["testUser3"] = addStandardUserData.data.addStandardUser;
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser4 })
    );
    users["testUser4"] = addStandardUserData.data.addStandardUser;
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser5 })
    );
    users["testUser5"] = addStandardUserData.data.addStandardUser;
    let e: any;
    try {
      await delay(5000); // More Step Function Coginto-DeleteUser delay, lets compensate for it here.
      const testUser6 = splitEmail[0] + "+6@" + splitEmail[1];
      await API.graphql(
        graphqlOperation(addStandardUser, { username: testUser6 })
      );
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch("PlanUserLimitReached");
  }, 15000);

  test("deactivateUser", async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    let e: any;
    const data: any = await API.graphql({
      query: deactivateUser,
      variables: { id: users["testUser2"].id },
    });
    expect(data.data.deactivateUser.enabled).toBeFalsy();
  });

  test("fail - deactivateOwner", async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    let e: any;
    try {
      await API.graphql({
        query: deactivateUser,
        variables: { id: configVars.testUsername },
      });
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch("CannotDeactivateOwner");
  });

  test("activateUser", async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    let e: any;
    const data: any = await API.graphql({
      query: activateUser,
      variables: { id: users["testUser2"].id },
    });
    expect(data.data.activateUser.enabled).toBeTruthy();
  });
});

describe("downgrade and deactivate users", () => {
  let users = {};

  beforeAll(async () => {
    cognito = new CognitoIdentityProviderClient();
    configVars = await GetConfigVars(Amplify);
    stripe = require("stripe")(configVars["stripeToken-dev"]);
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (!testUserExists) {
      await CognitoCreateTestUser(configVars, cognito);
    }
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    return true;
  }, 85000);

  afterAll(async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (testUserExists) {
      await API.graphql({
        query: enableDeleteAccount,
      });
      await API.graphql(graphqlOperation(deleteAccount));
    }
    await Auth.signOut();
    return true;
  }, 10000);

  test("setup data for following tests 4 - confirm setup with confirmAddPlan", async () => {
    const setupIntentData: any = await API.graphql(
      graphqlOperation(createPlanIntent, {
        planId: configVars.testFreeTrialPlanId,
      })
    );
    expect(setupIntentData.data.createPlanIntent.clientSecret).toBeDefined();

    // use stripe.js stripe.createPaymentMethod in actual frontend
    const newPaymentMethod = await CreatePaymentMethod(stripe);

    const confirmAddPlanData: any = await API.graphql(
      graphqlOperation(confirmAddPlan, {
        paymentMethodId: newPaymentMethod.id,
        planId: configVars.testFreeTrialPlanId,
        setupIntentClientSecret:
          setupIntentData.data.createPlanIntent.clientSecret,
      })
    );
    expect(confirmAddPlanData.data.confirmAddPlan.id).toBeDefined();
  }, 10000);

  test("add users until plan limit has been reached", async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser2 = splitEmail[0] + "+2@" + splitEmail[1];
    const testUser3 = splitEmail[0] + "+3@" + splitEmail[1];
    const testUser4 = splitEmail[0] + "+4@" + splitEmail[1];
    const testUser5 = splitEmail[0] + "+5@" + splitEmail[1];
    const response: any = await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser2 })
    );
    users["testUser2"] = response.data.addStandardUser;
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser3 })
    );
    users["testUser3"] = response.data.addStandardUser;
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser4 })
    );
    users["testUser4"] = response.data.addStandardUser;
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser5 })
    );
    users["testUser5"] = response.data.addStandardUser;
    let e: any;
    try {
      await delay(5000); // More Step Function Coginto-DeleteUser delay, lets compensate for it here.
      const testUser6 = splitEmail[0] + "+6@" + splitEmail[1];
      await API.graphql(
        graphqlOperation(addStandardUser, { username: testUser6 })
      );
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch("PlanUserLimitReached");
  }, 15000);

  test("checkout paid plan preview from trial plan", async () => {
    const checkoutData: any = await API.graphql({
      query: checkout,
      variables: { planId: configVars.testPaidPlanId },
    });
    expect(checkoutData.data.checkout.oldPlanTotal).toEqual(0);
    expect(checkoutData.data.checkout.nextInviceSubTotal).toBeGreaterThan(0);
  });

  test("downgrade plan check deactivated users", async () => {
    let e: any;
    let data: any = {};
    try {
      data = await API.graphql({
        query: changePlan,
        variables: { planId: configVars.testPaidPlanId },
      });
    } catch (err) {
      e = err;
    }
    expect(data.data.changePlan.planId).toBeDefined();
    expect(data.data.changePlan.users).toHaveLength(2);
  });

  test("fail - attempt to activate user past plan limit", async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    let e: any;
    try {
      await API.graphql({
        query: activateUser,
        variables: { id: users["testUser2"].id },
      });
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch("PlanUserLimitReached");
  });
});

describe("cancel at period end -> speed up time -> plan actually cancels -> webhook triggers graphql subscription update", () => {
  let users = {};

  beforeAll(async () => {
    cognito = new CognitoIdentityProviderClient();
    configVars = await GetConfigVars(Amplify);
    stripe = require("stripe")(configVars["stripeToken-dev"]);
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (!testUserExists) {
      await CognitoCreateTestUser(configVars, cognito);
    }
    await Auth.signIn(configVars.testUsername, configVars.testPassword);

    //setup data for following tests 6 - confirm setup with confirmAddPlan
    const setupIntentData: any = await API.graphql(
      graphqlOperation(createPlanIntent, {
        planId: configVars.testFreeTrialPlanId,
      })
    );
    expect(setupIntentData.data.createPlanIntent.clientSecret).toBeDefined();

    // use stripe.js stripe.createPaymentMethod in actual frontend
    const newPaymentMethod = await CreatePaymentMethod(stripe);

    const confirmAddPlanData: any = await API.graphql(
      graphqlOperation(confirmAddPlan, {
        paymentMethodId: newPaymentMethod.id,
        planId: configVars.testFreeTrialPlanId,
        setupIntentClientSecret:
          setupIntentData.data.createPlanIntent.clientSecret,
      })
    );
    expect(confirmAddPlanData.data.confirmAddPlan.id).toBeDefined();
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    return true;
  }, 85000);

  afterAll(async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (testUserExists) {
      await API.graphql({
        query: enableDeleteAccount,
      });
      await API.graphql(graphqlOperation(deleteAccount));
    }
    await Auth.signOut();
    return true;
  }, 10000);

  test("cancelPaidPlanAtEndOfPeriod", async () => {
    await delay(3000);
    const tenantData: any = await API.graphql({
      query: cancelPaidPlanAtPeriodEnd,
    });
    expect(
      tenantData.data.cancelPaidPlanAtPeriodEnd.cancelPlanAt
    ).toBeGreaterThan(0);
  }, 10000);

  test("add users to test cancellation", async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser2 = splitEmail[0] + "+2@" + splitEmail[1];
    const testUser3 = splitEmail[0] + "+3@" + splitEmail[1];
    const testUser4 = splitEmail[0] + "+4@" + splitEmail[1];
    const testUser5 = splitEmail[0] + "+5@" + splitEmail[1];
    const response: any = await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser2 })
    );
    users["testUser2"] = response.data.addStandardUser;
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser3 })
    );
    users["testUser3"] = response.data.addStandardUser;
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser4 })
    );
    users["testUser4"] = response.data.addStandardUser;
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser5 })
    );
    users["testUser5"] = response.data.addStandardUser;
    let e: any;
    try {
      await delay(5000); // More Step Function Coginto-DeleteUser delay, lets compensate for it here.
      const testUser6 = splitEmail[0] + "+6@" + splitEmail[1];
      await API.graphql(
        graphqlOperation(addStandardUser, { username: testUser6 })
      );
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch("PlanUserLimitReached");
  }, 15000);

  test("subscribe to planCancelled fast forward time and await for cancelation webhook to fire.", async () => {
    const tenantData: any = await API.graphql({ query: getTenant });
    let planCanceledSub = await configVars.apolloClient
      .subscribe({
        query: gql(planCanceled),
        variables: { id: tenantData.data.getTenant.id },
      })
      .subscribe({
        next(data) {
          console.log("... planCanceled fired.");
          expect(data.data.planCanceled.id).toBeDefined();
          planCanceledSub.unsubscribe();
          return;
        },
        error(error) {
          console.log(error);
        },
      });
    expect(planCanceledSub._state).toEqual("ready");
    console.log("waiting for planCancelled to fire...");
    const timestampPlus5Seconds = Math.floor(+new Date() / 1000) + 5;
    const dbres = await DynamoGetTenantWithProcessorCustomerId(
        configVars.defaultRegion,
        tenantData.data.getTenant.id
      );
    const res = await StripeFastForwardCanceledAt(
      stripe,
      timestampPlus5Seconds,
      dbres.Item.ProcessorCustomerId.S
    );
    let e: any;
    try {
    await delay(5000);
      await API.graphql({ query: reactivateCancelingPaidPlan });
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch("FailPlanNotInCancelingState");
  }, 10000);
});

describe("cancel and reactivate plan", () => {
  beforeAll(async () => {
    cognito = new CognitoIdentityProviderClient();
    configVars = await GetConfigVars(Amplify);
    stripe = require("stripe")(configVars["stripeToken-dev"]);
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (!testUserExists) {
      await CognitoCreateTestUser(configVars, cognito);
    }
    await Auth.signIn(configVars.testUsername, configVars.testPassword);

    //setup data for following tests 6 - confirm setup with confirmAddPlan
    const setupIntentData: any = await API.graphql(
      graphqlOperation(createPlanIntent, {
        planId: configVars.testFreeTrialPlanId,
      })
    );
    expect(setupIntentData.data.createPlanIntent.clientSecret).toBeDefined();

    // use stripe.js stripe.createPaymentMethod in actual frontend
    const newPaymentMethod = await CreatePaymentMethod(stripe);

    const confirmAddPlanData: any = await API.graphql(
      graphqlOperation(confirmAddPlan, {
        paymentMethodId: newPaymentMethod.id,
        planId: configVars.testFreeTrialPlanId,
        setupIntentClientSecret:
          setupIntentData.data.createPlanIntent.clientSecret,
      })
    );
    expect(confirmAddPlanData.data.confirmAddPlan.id).toBeDefined();
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    return true;
  }, 85000);

  afterAll(async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (testUserExists) {
      await API.graphql({
        query: enableDeleteAccount,
      });
      await API.graphql(graphqlOperation(deleteAccount));
    }
    await Auth.signOut();
    return true;
  }, 10000);

  test("fail - reactivateCancelingPaidPlan when plan cant be reactivated", async () => {
    await delay(3000);
    let e: any;
    try {
      await API.graphql({ query: reactivateCancelingPaidPlan });
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch("FailPlanNotInCancelingState");
  });

  test("cancelPaidPlanAtEndOfPeriod", async () => {
    await delay(3000);
    const tenantData: any = await API.graphql({
      query: cancelPaidPlanAtPeriodEnd,
    });
    expect(
      tenantData.data.cancelPaidPlanAtPeriodEnd.cancelPlanAt
    ).toBeGreaterThan(0);
  }, 10000);

  test("fail - reactivateCancelingPaidPlan after cancelPlanAt deadline passed", async () => {
    await delay(3000);
    let e: any;
    const session: any = await Auth.currentSession();
    const minusFourtyDays = Math.floor(+new Date() / 1000) - 40 * 24 * 60 * 60;
    await DynamoBDFastForwardCancelPlanAt(
      configVars.defaultRegion,
      minusFourtyDays,
      session.idToken.payload.name
    );

    try {
      await API.graphql({ query: reactivateCancelingPaidPlan });
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch(
      "CannotReactivateAfterCancelPlanAtDeadlinePassed"
    );
  }, 10000);

  test("reactivateCancelingPaidPlan", async () => {
    let e: any;
    let data: any = {};
    const session: any = await Auth.currentSession();
    const plusFourtyDays = Math.floor(+new Date() / 1000) + 40 * 24 * 60 * 60;
    await DynamoBDFastForwardCancelPlanAt(
      configVars.defaultRegion,
      plusFourtyDays,
      session.idToken.payload.name
    );

    try {
      data = await API.graphql({ query: reactivateCancelingPaidPlan });
    } catch (err) {
      e = err;
    }
    expect(data.data.reactivateCancelingPaidPlan.id).toBeDefined();
  });

  test("change to different Plan while in cancelingPlan state- should uncancel plan and update plan", async () => {
    const tenantData: any = await API.graphql({
      query: cancelPaidPlanAtPeriodEnd,
    });
    expect(
      tenantData.data.cancelPaidPlanAtPeriodEnd.cancelPlanAt
    ).toBeGreaterThan(0);
    await delay(3000);
    const data: any = await API.graphql({
      query: changePlan,
      variables: { planId: configVars.testPaidPlanId },
    });
    expect(data.data.changePlan.planId).toBeDefined();
    expect(data.data.changePlan.cancelPlanAt).toBeNull();
  }, 10000);
});

describe("create new user get free trial plan, change to other plans", () => {
  let users = {};

  beforeAll(async () => {
    cognito = new CognitoIdentityProviderClient();
    configVars = await GetConfigVars(Amplify);
    stripe = require("stripe")(configVars["stripeToken-dev"]);
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (!testUserExists) {
      await CognitoCreateTestUser(configVars, cognito);
    }
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    return true;
  }, 85000);

  afterAll(async () => { 
    await delay(5000); // More Step Function Coginto-DeleteUser delay, lets compensate for it here.  
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (testUserExists) {
      await API.graphql({
        query: enableDeleteAccount,
      });
      await API.graphql(graphqlOperation(deleteAccount));
    }
    await Auth.signOut();
    return true;
  }, 10000);

  test("fail can't cancel free plan", async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    let e: any;
    try {
      await API.graphql(graphqlOperation(cancelPaidPlanAtPeriodEnd));
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch("Unauthorized");
  }, 10000);

  test("setup data for following tests 5 - confirm setup with confirmAddPlan", async () => {
    const setupIntentData: any = await API.graphql(
      graphqlOperation(createPlanIntent, {
        planId: configVars.testFreeTrialPlanId,
      })
    );
    expect(setupIntentData.data.createPlanIntent.clientSecret).toBeDefined();

    // use stripe.js stripe.createPaymentMethod in actual frontend
    const newPaymentMethod = await CreatePaymentMethod(stripe);

    const confirmAddPlanData: any = await API.graphql(
      graphqlOperation(confirmAddPlan, {
        paymentMethodId: newPaymentMethod.id,
        planId: configVars.testFreeTrialPlanId,
        setupIntentClientSecret:
          setupIntentData.data.createPlanIntent.clientSecret,
      })
    );
    expect(confirmAddPlanData.data.confirmAddPlan.id).toBeDefined();
  }, 20000);

  test("add users until plan limit has been reached", async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    const splitEmail =
      configVars["contactUsEmail-dev"].split("@");
    const testUser2 = splitEmail[0] + "+2@" + splitEmail[1];
    const testUser3 = splitEmail[0] + "+3@" + splitEmail[1];
    const testUser4 = splitEmail[0] + "+4@" + splitEmail[1];
    const testUser5 = splitEmail[0] + "+5@" + splitEmail[1];
    const response: any = await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser2 })
    );
    users["testUser2"] = response.data.addStandardUser;
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser3 })
    );
    users["testUser3"] = response.data.addStandardUser;
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser4 })
    );
    users["testUser4"] = response.data.addStandardUser;
    await API.graphql(
      graphqlOperation(addStandardUser, { username: testUser5 })
    );
    users["testUser5"] = response.data.addStandardUser;
    let e: any;
    try {
      await delay(5000); // More Step Function Coginto-DeleteUser delay, lets compensate for it here.
      const testUser6 = splitEmail[0] + "+6@" + splitEmail[1];
      await API.graphql(
        graphqlOperation(addStandardUser, { username: testUser6 })
      );
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch("PlanUserLimitReached");
  }, 15000);

  test("deactivateUser", async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    let e: any;
    const data: any = await API.graphql({
      query: deactivateUser,
      variables: { id: users["testUser2"].id },
    });
    expect(data.data.deactivateUser.enabled).toBeFalsy();
  });

  test("activateUser", async () => {
    await delay(5000); // More Step Function Coginto-DeactivateUser delay, lets compensate for it here.
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    let e: any;
    const data: any = await API.graphql({
      query: activateUser,
      variables: { id: users["testUser2"].id },
    });
    expect(data.data.activateUser.enabled).toBeTruthy();
  }, 10000);

  test("fail change paid plan to SAME paid plan", async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    let e: any;
    try {
      await API.graphql({
        query: changePlan,
        variables: { planId: configVars.testFreeTrialPlanId },
      });
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toEqual("NewPlanIsSameAsTheOldPlan");
  });

  test("checkout paid plan preview from trial plan", async () => {
    const checkoutData: any = await API.graphql({
      query: checkout,
      variables: { planId: configVars.testPaidPlanId },
    });
    expect(checkoutData.data.checkout.oldPlanTotal).toEqual(0);
    expect(checkoutData.data.checkout.nextInviceSubTotal).toBeGreaterThan(0);
  });

  test("fake change trial period to earlier date", async () => {
    const plusFiveDays = Math.floor(+new Date() / 1000) + 5 * 24 * 60 * 60;
    await delay(30000);
    let customer = await stripe.customers.search({
      query: 'email:"' + configVars.testUsername + '"',
    });
    customer = await stripe.customers.retrieve(customer.data[0].id, {
      expand: ["subscriptions"],
    });
    //console.log(plusFiveDays)
    await stripe.subscriptions.update(customer.subscriptions.data[0].id, {
      trial_end: plusFiveDays,
    });
  }, 35000);

  test("downgrade plan - will deactivate additional users", async () => {
    let e: any;
    try {
      const data: any = await API.graphql({
        query: changePlan,
        variables: { planId: configVars.testPaidPlanId },
      });
      expect(data.data.changePlan.planId).toBeDefined();
      //data = await API.graphql({query: listUsers});
    } catch (err) {
      e = err;
    }
  });

  test("checkout preview from paid plan", async () => {
    await delay(5000);
    const checkoutData: any = await API.graphql({
      query: checkout,
      variables: { planId: configVars.testFreeTrialPlanId },
    });
    expect(checkoutData.data.checkout.oldPlanTotal).toEqual(0);
  }, 15000);

  test("confirm paid plan to another paid plan", async () => {
    const modifiedPaidPlan: any = await API.graphql({
      query: changePlan,
      variables: { planId: configVars.testFreeTrialPlanId },
    });
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    expect(modifiedPaidPlan.data.changePlan.id).toBeTruthy;
  }, 10000);

  test("fail createPlanIntent but already has a plan", async () => {
    let e: any;
    try {
      const d = await API.graphql(
        graphqlOperation(createPlanIntent, {
          planId: configVars.testFreeTrialPlanId,
        })
      );
      console.log(d);
    } catch (err) {
      e = err; //in case try attempt actually succeeds, make e:any a global varible and catch outside of try statemnt
    }
    expect(e.errors[0].errorType).toMatch("PaidPlanExists");
  });

  test("fail default plan change to same plan", async () => {
    const session: any = await Auth.currentSession();
    let e: any;
    try {
      await API.graphql(
        graphqlOperation(changePlan, { planId: session.idToken.payload.planId })
      );
      await Auth.signOut();
      await Auth.signIn(configVars.testUsername, configVars.testPassword);
    } catch (err) {
      e = err;
    }

    expect(e.errors[0].errorType).toMatch("NewPlanIsSameAsTheOldPlan");
  });

});

describe("crud payment methods, and retrieve billing lists", () => {
  let newPaymentMethod: any;

  beforeAll(async () => {
    cognito = new CognitoIdentityProviderClient();
    configVars = await GetConfigVars(Amplify);
    stripe = require("stripe")(configVars["stripeToken-dev"]);
    //check if user exists
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (!testUserExists) {
      await CognitoCreateTestUser(configVars, cognito);
    }
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    return true;
  }, 15000);

  afterAll(async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    testUserExists = await CheckIfTestUserExists(configVars, cognito);
    if (testUserExists) {
      const enableDelData = await API.graphql({
        query: enableDeleteAccount,
      });
      await API.graphql(graphqlOperation(deleteAccount));
    }
    await Auth.signOut();
    return true;
  }, 10000);

  test("setup data for following tests 3 - confirmAddPlan", async () => {
    const setupIntentData: any = await API.graphql(
      graphqlOperation(createPlanIntent, {
        planId: configVars.testFreeTrialPlanId,
      })
    );
    expect(setupIntentData.data.createPlanIntent.clientSecret).toBeDefined();

    // use stripe.js stripe.createPaymentMethod in actual frontend
    const newPaymentMethod = await CreatePaymentMethod(stripe);

    const confirmAddPlanData: any = await API.graphql(
      graphqlOperation(confirmAddPlan, {
        paymentMethodId: newPaymentMethod.id,
        planId: configVars.testFreeTrialPlanId,
        setupIntentClientSecret:
          setupIntentData.data.createPlanIntent.clientSecret,
      })
    );
    expect(confirmAddPlanData.data.confirmAddPlan.id).toBeDefined();
  }, 20000);

  test("add another payment method and set as default payment method", async () => {
    await delay(10000);
    const paymentMethodIntentData: any = await API.graphql(
      graphqlOperation(createPaymentMethodIntent)
    );
    expect(
      paymentMethodIntentData.data.createPaymentMethodIntent.clientSecret
    ).toBeDefined();

    newPaymentMethod = await CreatePaymentMethod(stripe, 'pm_card_mastercard');
    const confirmAddPaymentMethodData: any = await API.graphql(
      graphqlOperation(confirmAddPaymentMethod, {
        paymentMethodId: newPaymentMethod.id,
        setupIntentClientSecret:
          paymentMethodIntentData.data.createPaymentMethodIntent.clientSecret,
      })
    );
    expect(
      confirmAddPaymentMethodData.data.confirmAddPaymentMethod.id
    ).toBeDefined();

    //fake create and attach payment method- use stripe Elements in frontend app
    // 'pm_card_visa'

    await delay(15000);
    let customer = await stripe.customers.search({
      query: 'email:"' + configVars.testUsername + '"',
    });
    await stripe.paymentMethods.attach(newPaymentMethod.id, {
      customer: customer.data[0].id,
    });
    delay(5000);
    let paymentMethods: any = await API.graphql(
      graphqlOperation(listPaymentMethods)
    );
    expect(paymentMethods.data.listPaymentMethods.length).toEqual(2);
  }, 35000);

  test("change default payment method", async () => {
    await Auth.signOut();
    await Auth.signIn(configVars.testUsername, configVars.testPassword);
    let paymentMethods: any = await API.graphql(
      graphqlOperation(listPaymentMethods)
    );
    try {
      const newDefaultPaymentMethod: any = await API.graphql(
        graphqlOperation(setDefaultPaymentMethod, {
          paymentMethodId: paymentMethods.data.listPaymentMethods[0].id,
        })
      );
      expect(
        newDefaultPaymentMethod.data.setDefaultPaymentMethod[0].default
      ).toBeTruthy();
    } catch (err) {
      console.log(util.inspect(err, false, null, true));
    }
  }, 10000);

  test("fail - remove default payment method while other methods exist", async () => {
    let paymentMethods: any = await API.graphql(
      graphqlOperation(listPaymentMethods)
    );
    let e: any;
    try {
      await API.graphql(
        graphqlOperation(deletePaymentMethod, {
          paymentMethodId: paymentMethods.data.listPaymentMethods[0].id,
        })
      );
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch("FailDefaultPaymentMethod");
  });

  test("remove payment method", async () => {
    let paymentMethods: any = await API.graphql(
      graphqlOperation(listPaymentMethods)
    );
    const paymentMethodDeleted: any = await API.graphql(
      graphqlOperation(deletePaymentMethod, {
        paymentMethodId: paymentMethods.data.listPaymentMethods[1].id,
      })
    );
    //console.log(util.inspect(paymentMethodDeleted, false, null, true))
    expect(paymentMethodDeleted.data.deletePaymentMethod.id).toBeDefined();
  });

  test("fail - remove only payment method while still under a plan", async () => {
    let paymentMethods: any = await API.graphql(
      graphqlOperation(listPaymentMethods)
    );
    //console.log(util.inspect(paymentMethods, false, null, true))
    let e: any;
    try {
      await API.graphql(
        graphqlOperation(deletePaymentMethod, {
          paymentMethodId: paymentMethods.data.listPaymentMethods[0].id,
        })
      );
    } catch (err) {
      e = err;
    }
    expect(e.errors[0].errorType).toMatch(
      "FailOnlyPaymentMethodWhilePayingForPlan"
    );
  });
});

//TODO test delete all payment methods and add a subscription- should not have trial period added back

test("delete leftover test user account", async () => {
  configVars = await GetConfigVars(Amplify);
  stripe = require("stripe")(configVars["stripeToken-dev"]);
  await Auth.signIn(configVars.testUsername, configVars.testPassword);
  await API.graphql({
    query: enableDeleteAccount,
  });
  await API.graphql(graphqlOperation(deleteAccount));
  await Auth.signOut();
}, 30000);



async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/*
describe("websocket tests", () => {
  test("socket Connection", async () => {
    // Create WebSocket connection.
    let socket: WebSocket;
    try {
      socket = new WebSocket(
        "wss://apidev.s6pack.build/graphql/realtime?header=eyJBdXRob3JpemF0aW9uIjoiZXlKcmFXUWlPaUp1SzA1WFYyMWNMMGRFVkRsc1VXMU5TMlF4YW5JM2VGTmpUa0p6T0dsSk5FWjBlRVoxTTI1NU4yNHdaejBpTENKaGJHY2lPaUpTVXpJMU5pSjkuZXlKemRXSWlPaUkzTTJVM01EWXdPUzAyTXpCakxUUXhNV0V0T0RFeVl5MDNabUptTkRNeU9EazRPVEFpTENKamIyZHVhWFJ2T21keWIzVndjeUk2V3lKUGQyNWxjaUpkTENKbGJXRnBiRjkyWlhKcFptbGxaQ0k2ZEhKMVpTd2lhWE56SWpvaWFIUjBjSE02WEM5Y0wyTnZaMjVwZEc4dGFXUndMblZ6TFdWaGMzUXRNaTVoYldGNmIyNWhkM011WTI5dFhDOTFjeTFsWVhOMExUSmZRWGRLYmxGSGFVTTNJaXdpWTI5bmJtbDBienAxYzJWeWJtRnRaU0k2SWpjelpUY3dOakE1TFRZek1HTXROREV4WVMwNE1USmpMVGRtWW1ZME16STRPVGc1TUNJc0ltOXlhV2RwYmw5cWRHa2lPaUl3TnpWaVl6UTFNUzFtTlRBeExUUTJaRGt0WWpNNFlpMDBaalJtWWpWa05XTXlNMlVpTENKaGRXUWlPaUkyTXpkc2RqVTJjR0V6Y1hWaGJXVjFORzEyTUdnMk1uTXhPU0lzSW1WMlpXNTBYMmxrSWpvaVpERmpPR1kyTlRndFpqSXpPUzAwTnpjMkxXSTBZemt0T0RVM1lXWTBNRGd5TkRFeElpd2lkRzlyWlc1ZmRYTmxJam9pYVdRaUxDSjBjbWxoYkZCbGNtbHZaRVZzYVdkaFlteGxJam9pZEhKMVpTSXNJbUYxZEdoZmRHbHRaU0k2TVRjeE1EazNNVEl4TXl3aWJtRnRaU0k2SWpJeE9EWXhNbUZrTFdRNFpqZ3ROREF3TXkxaU1ERXhMV1ZoWlRJMlptTTRaalJqTVNJc0luUnlhV0ZzVUdWeWFXOWtSWGh3YVhKbFpDSTZJbVpoYkhObElpd2ljR3hoYmtsa0lqb2laR1YyWDNOa2RqVTFObWczU0daNWVtODBJaXdpY0d4aGJsVnpaWEp6SWpvaU15SXNJbVY0Y0NJNk1UY3hNRGszTkRneE1Td2ljR3hoYmxCeWFXTmxJam9pTkRrNUlpd2lhV0YwSWpveE56RXdPVGN4TWpFekxDSnFkR2tpT2lJeFlXTTNNR0kxT1Mxa05qSmhMVFJoTlRFdE9UZGpZUzAwTWpSaE5UZzBaVFJoTVdFaUxDSmxiV0ZwYkNJNkltSnRhV3hsYzNBclpERkFaMjFoYVd3dVkyOXRJbjAuTzc3S01iVzk3a2s2SnVUQzZvd3JNQ2d5YWR5dnNScUd6MkJHd1dKV09JUDVfMWcxd2JtUi1jbFVNMDhiSTd6WkRnZ2pEMVRoYzlwY2t3OVZzd1lpWVY2clRaWEFSWTZzS2ltTHVOV1pjMEkzVFRmTmkteXpTZDNzZ21YRFhDWUVNYXliRnBzXzliekF0cWdXeXlBd1V6clZUVmRjUXFPaEp0S3YzLXNhWWFHVzZWRkx4QlpHc0JuV05QVXkxeVVja0pTZjYtem43UVNfRDY1LURlYjFQRVpsQmpFWFR1VUYyVmlGX0R4VFNqNGQwSFdIMDd4MmtlVnh2M1RxTjk0emFQMnhSUnV6SElXYkVTUVg3dnJCZktMMjJSVHFjNExudmJOdXFWeS1wUXRTUFVsS0h0UTFrMDVzeDdDOTlUSTJXa256STVHMldNdWM4TWdZWDlEX1ZnIiwiaG9zdCI6ImFwaWRldi5zdGF0aW9uc2hxLmlvIn0=&payload=e30="
      );
      console.log(socket);
    } catch (error) {
      console.log(error);
    }

    // Connection opened
    socket.addEventListener("open", (event) => {
      socket.send("Hello Server!");
    });

    // Listen for messages
    socket.addEventListener("message", (event) => {
      console.log("Message from server ", event.data);
    });
  });
});
*/
