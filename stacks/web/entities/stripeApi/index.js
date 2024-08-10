
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27'
});
var moment = require('moment')

exports.handler = async function (event, context, callback){
  var trialPeriodInDays = process.env.TRIAL_PERIOD_IN_DAYS
  console.log(event.callback)
  let result;
  let res;
  switch (event.callback) {
    case 'getCustomerByEmail':
      let customer = await stripe.customers.search({
        query: 'email:"'+event.email+'"'
      })
      res = await stripe.customers.retrieve(customer.data[0].id,{'expand': ['subscriptions']});
      return res
    break
    case 'getPaymentMethods':
      res = await stripe.paymentMethods.list({
        customer: customer.id,
        type: 'card',
      })
      return res
    break
    case 'getPaymentMethod' : 
      res = await stripe.customers.retrievePaymentMethod(
        event.customerId,
        event.paymentMethodId
      )
      return res
    break
    case 'updatePaymentMethod':
      res = await stripe.customers.update(customer.id,{invoice_settings : {default_payment_method : paymentMethods.data[0].id}})
      return res
    break
    case'createPaymentMethodIntent':
      res = await stripe.setupIntents.create({customer: event.customerId, automatic_payment_methods: {enabled: true, allow_redirects: 'never'}, metadata : event.metadata})
      return res
    break;
    case'createCustomer':
      res = await stripe.customers.create({email: event.email, metadata: {tenantId: event.tenantId }})
      return res
    break;
    case'getCustomer':
      res = await stripe.customers.retrieve(event.customerId)
      return res
    break;
    case'setDefaultCustomerPaymentMethod':
      res = await stripe.customers.update(
        event.customerId, 
        { invoice_settings: { default_payment_method : event.paymentMethodId }
      })
      return res
    break;
    case'deleteCustomer':
      res = await stripe.customers.del(event.customerId)
      return res
    break;
    case 'createSubscription':
    let postJson = {
        customer: event.customerId,
        metadata: event.metadata,
        items: [{
          price: event.priceId,
        }]
      }
      if(event.trialPeriodStatus === 'AVAILABLE'){
        postJson.trial_end = moment().clone().add(trialPeriodInDays, "days").unix()
      }
      res = await stripe.subscriptions.create(postJson)
      return res
    break
    case 'updateSubscriptionMetadata':
      res = await stripe.subscriptions.update(
        event.planId,
        {metadata: event.metadata}
      )
      return res;
      break
    case 'cancelSubscription':
      res = await stripe.subscriptions.del(event.customerId)
      return res
    break
    case 'reactivateCancellingSubscription':
      res = await stripe.subscriptions.update(
        event.currentSubscriptionId,
        {cancel_at_period_end: false}
      )
      return res
    break
    case 'cancelSubscriptionAtPeriodEnd':
      res = await stripe.subscriptions.update(
        event.currentSubscriptionId,
        {cancel_at_period_end: true}
      )
      return res
    break
    case 'queryProductByMetadata':
      res = await stripe.products.search({
        query: "metadata['planId']:'"+event.metadata.planId+"'",
      })
      return res
    break
    case 'querySubscriptionByMetadataPlanIdAndTenantId':
      res =  stripe.subscriptions.search({
        query: "metadata['tenantId']:'"+event.tenantId+"' AND metadata['planId']:'"+event.planId+"'",
      })
      return res
    break
    case 'retrieveUpcomingInvoice':
      res = await stripe.invoices.retrieveUpcoming({
        customer: event.customerId,
      });
      return res
    case 'listInvoices':
      res = await stripe.invoices.list({
        customer: event.customerId,
        limit: 100
      });
      return res
    case 'previewPlanChange': //upgrade/downgrade the subscription to a different paid plan (upgradeFrom/downgradeTo free plan is different) 
      res = await stripe.invoices.retrieveUpcoming({
        customer: event.customerId,
        subscription: event.planId,
        subscription_items: [{
          id: event.subscriptionItemId,
          price: event.newPriceId,
        }]
      })
      return res
    break
    case 'changeSubscription':
      res = stripe.subscriptions.update(
        event.currentSubscriptionId, 
        {
          cancel_at_period_end: false,
          items: [
            {
              id: event.currentSubscriptionItemId,
              price: event.newProductPriceId
            },
          ],
      })
      return res;
    break
    case 'getCustomerSubscription':
      res = await stripe.subscriptions.list({
        customer: event.customerId,
        status: "all",
        expand: ['data.default_payment_method'],
      })
      return res
    break
    case 'getActiveCustomerSubscription':
      res = await stripe.subscriptions.list({
        customer: event.customerId,
        status: 'active',
        limit: 1
      });

      if(res.data.length == 0){
        res = await stripe.subscriptions.list({
          customer: event.customerId,
          status: 'trialing',
          limit: 1
        })
      }
      return res
    break
    case 'getPriceFromProductId':
      res = await stripe.prices.search({query: "product:'"+event.productId+"'"})
      return res
    break
    case 'listCharges':
      let options = { limit: event.limit };
      if(event.input.startingAfter){
        options.starting_after = event.input.startingAfter;
      }
      if(event.input.endingBefore){
        options.ending_before = event.input.endingBefore;
      }
      if(event.customer){
        options.customer = event.customer;
      }
      res = await stripe.charges.list(options);
      return res
    break
    case 'attachPaymentMethod':
      res = await stripe.paymentMethods.attach(
        event.paymentMethodId,
        {customer: event.customerId}
      );
      return res
    break
    case 'detachPaymentMethod':
      res = await stripe.paymentMethods.detach(
        event.paymentMethodId,
        {customer: event.customerId}
      );
      return res
    break
    case 'confirmSetupIntent':
      res = await stripe.setupIntents.confirm(
        event.setupIntentId,
        {
            payment_method: event.paymentMethodId
        }
      );
      return res
    break
    case 'listCustomerPaymentMethods':
      res = await stripe.customers.listPaymentMethods(
        event.customerId,
        {type: event.type}
      )
      return res
    break
    default:
      callback(null, {
        statusCode: 400,
        error: { message: event.callback+" callback argument not found." } 
      })
    break
  }
}
