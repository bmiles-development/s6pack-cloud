const graphqlEndpoint = process.env.GRAPHQL_API_ENDPOINT; //'https://yourappsyncapiendpoint.appsync-api.us-west-2.amazonaws.com/graphql';
const region = process.env.REGION;
const lambdaUrlAccessUUID = process.env.LAMBDA_URL_ACCESS_UUID;

const https = require("https");
const aws4 = require("aws4");
const url = require("url");
const graphqlEndpointParsed = url.parse(graphqlEndpoint, true);

exports.handler = async (event) => {
  if(event.headers["lambda-url-access"] != lambdaUrlAccessUUID ){
    return {
      statusCode: 403,
      body: "Forbidden",
    };
  }
  let itemBody = {};
  let eventBody = JSON.parse(event.body);

  // Since Clodfront AWS_IAM cannot forward POST requests to lambda url, we can pass a 
  // header unique "lambda-url-access" to this lambda and then we can isolate traffic through the cloudfront endpoint only 

  switch (eventBody["type"]) {
    case "customer.subscription.deleted":
      itemBody = {
        query: `mutation cancelPlanPeriodEndedWebhook($input: WebhookValidationInput!) { 
          cancelPlanPeriodEndedWebhook(input: $input) { 
            id
            planId
            plan {
              id
            } 
          }
        }`,
        variables: {
          input: {
            tenantId: eventBody.data.object.metadata.tenantId,
            headers: JSON.stringify(event.headers),
            body: event.body,
          },
        },
      };
      break;

    default:
      const err = new Error(event.callback + " graphql query argument not found.")
      throw err
      break;
  }

  const graphqlRequest = {
    host: graphqlEndpointParsed.host,
    method: "POST",
    path: graphqlEndpointParsed.pathname,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(itemBody),
    service: "appsync",
    region: region,
  };

  // Sign the request (Sigv4)
  aws4.sign(graphqlRequest);

  //console.log(graphqlRequest)

  const data = await new Promise((resolve, reject) => {
    const req = https.request(graphqlRequest, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        data = JSON.parse(data);
        if (typeof data.errors !== "undefined") {
          console.log(data);
          reject(data.errors[0].message);
        } else {
          resolve(data);
        }
      });

      res.on("error", (err) => {
        console.log(data);
        reject(err);
      });
    });

    req.write(graphqlRequest.body);
    req.end();
  });
  console.log(data);
  return {
    statusCode: 200,
    body: data,
  };
};
