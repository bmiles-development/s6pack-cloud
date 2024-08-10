import { Construct } from 'constructs';

export class Iam extends Construct {
    private _jsonStringPolicies: any = {}

    public get jsonStringPolicies(){
        return this._jsonStringPolicies
    }

    constructor(scope: Construct, name: string, awsAccountId:string, hostedZone:string, region:string) {
        super(scope, name);

        this._jsonStringPolicies['sesIdentityPolicy'] = JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Sid: "",
                Effect: "Allow",
                Principal: {
                    AWS:[
                        awsAccountId
                    ]
                },
                Action: [
                    "SES:SendRawEmail",
                    "SES:SendEmail",
                ],
                Resource: [   
                   "arn:aws:ses:"+region+":"+awsAccountId+":identity/"+hostedZone
                ]
            }
            ]
        })
        
    }
    
}
