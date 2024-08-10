import {Product} from '../../../../.gen/providers/stripe/product'
import {Price} from '../../../../.gen/providers/stripe/price'
import { Construct } from "constructs";

export class StripeProduct extends Construct {
  private _products : any = {};

  get products(){
      return this._products;
  }

  constructor(scope: Construct, name: string, config:any, resourceType:string) {
    super(scope,name)
    
    Object.entries(config.stripe.SubscriptionPlans).forEach(([key, _value], _index) => {
        let metadata = config.stripe.SubscriptionPlans[key].metadata
        metadata.planId = resourceType+"_"+config.stripe.SubscriptionPlans[key].id
        this._products[config.stripe.SubscriptionPlans[key].name] = new Product(this, config.stripe.SubscriptionPlans[key].name, {
            name: config.stripe.SubscriptionPlans[key].name,
            type: "service",
            statementDescriptor: config.stripe.SubscriptionPlans[key].statementDescriptor,
            active: true,
            metadata: metadata
        })


        if(config.stripe.SubscriptionPlans[key].price != 0){
          this._products[config.stripe.SubscriptionPlans[key].name].price = new Price(this, config.stripe.SubscriptionPlans[key].name+"-price",{
              currency: "usd",
              billingScheme: "per_unit", //change to null if you want to force a price update
              product: this._products[config.stripe.SubscriptionPlans[key].name].id,
              unitAmount: config.stripe.SubscriptionPlans[key].price,
              recurring: {
                interval: "month",
                intervalCount: "1"
              }
          })
        }
    })
  }
}