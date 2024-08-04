import { Construct } from "constructs";
import { Wafv2IpSet } from "@cdktf/provider-aws/lib/wafv2-ip-set";
import { Wafv2RuleGroup } from "@cdktf/provider-aws/lib/wafv2-rule-group"

export class Waf extends Construct {
  private _awsUsEast1Provider: any;

  constructor(scope: Construct, name: string, awsUsEast1Provider:any) {
    super(scope, name);
    this._awsUsEast1Provider = awsUsEast1Provider;
  }


  public createStripeWebhooksWaf(name:string) {
    const stripeWebhookIpSet = new Wafv2IpSet(this, name, {
      addresses: ["10.1.1.1"],
      ipAddressVersion: "IPV4",
      name: "stripe-webkooks-ip-set",
      scope: "CLOUDFRONT",
      provider: this._awsUsEast1Provider
    })

    new Wafv2RuleGroup(this, name+"Group", {
      capacity: 2,
      name: "example-rule",
      scope: "CLOUDFRONT",
      provider: this._awsUsEast1Provider,
      rule: [
        {
          action: {
            allow: {},
          },
          name: "stripeWebhookIpRule",
          priority: 1,
          statement: {
            ip_set_reference_statement: { // snake case https://github.com/hashicorp/terraform-cdk/issues/3458
              arn: stripeWebhookIpSet.arn,
            },
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: false,
            metricName: "stripeWebhooksRule",
            sampledRequestsEnabled: false,
          },
        },
      ],
      visibilityConfig: {
        cloudwatchMetricsEnabled: false,
        metricName: "stripeWebhooksRuleGroup",
        sampledRequestsEnabled: false,
      },
    });
  }
}
