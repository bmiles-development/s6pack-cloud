import {WebhookEndpoint} from '../../../../.gen/providers/stripe/webhook-endpoint'
import { Construct } from "constructs";

export class StripeWebhookEndpoint extends Construct {
  private _webhookEndpoint : any = {};

  get webhookEndpoint(){
      return this._webhookEndpoint;
  }

  constructor(scope: Construct, name: string, url:string, httpScheme:string) {
    super(scope,name)
    this._webhookEndpoint = new WebhookEndpoint(this, name+"1", {
      url: httpScheme+url,
      enabledEvents: [
        "charge.dispute.created",
        "charge.failed",
        "charge.refunded",
        "charge.refund.updated",
        "customer.subscription.deleted"
      ]
  })

  }
}