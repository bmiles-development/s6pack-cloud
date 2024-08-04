const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async function (event, context, callback) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SIGNING_SECRET;
  try {
    argumentHeaders = JSON.parse(event.argumentHeaders)
    const sig = argumentHeaders["stripe-signature"];
    console.log(event.body)

    // since we can't get the raw.body required for constructEvent (unless we use ApiGateway) then 
    // we'll instead just refetch the event and compare
    /*
    const stripeEvent = stripe.webhooks.constructEvent(
      eventBody,
      sig,
      webhookSecret
    );*/

    const reFetchEvent = await stripe.events.retrieve(event.body.id);
    console.log(reFetchEvent)

    if(typeof reFetchEvent.id === "undefined"){
      throw new Error("Event Not Found.")
    }
    
    const data = {
      statusCode: 200,
      body: {
        received: true,
      },
    };
    return data;
  } catch (uncaughtError) {
    console.error(uncaughtError);
    throw uncaughtError;
  }
};
