
import {Construct} from "constructs"
import { AcmCertificateValidation } from "@cdktf/provider-aws/lib/acm-certificate-validation"

export class AcmCertificateValidationResource extends Construct {
        
    constructor(scope: Construct, name: string, acmResource:any, route53ValidationRecords:any, awsUsEast1Provider: any ) {
        super(scope, name)

        const validationRecords: string[] = []
        Object.entries(route53ValidationRecords).forEach(([key, _value], _index) => {
            validationRecords.push(route53ValidationRecords[key].record)
        })

        new AcmCertificateValidation(this, 'org-certificate-validation', {
            provider: awsUsEast1Provider,
            certificateArn: acmResource.certificates["appsyncSslCert"].arn,
            validationRecordFqdns: validationRecords
        })
    }
}