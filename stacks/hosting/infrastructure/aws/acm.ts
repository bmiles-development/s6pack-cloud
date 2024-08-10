import { Construct } from 'constructs';
import {AcmCertificate} from '@cdktf/provider-aws/lib/acm-certificate'
  
  export class Acm extends Construct {
    private _certificates : any = {}
    private _domainValidationRecords: any = []

    get domainValidationRecords(){
        return this._domainValidationRecords
    }

    get certificates(){
        return this._certificates
    }

    constructor(scope: Construct, name: string, hostedZone:string, config:any, awsUsEast1Provider: any) {
        super(scope, name)
        this.certificates["appsyncSslCert"] = new AcmCertificate(this, name+"appsync-ssl-cert", {
            provider: awsUsEast1Provider, // must be in us-east-1 as a requirement for cloudfront
            domainName : hostedZone,
            subjectAlternativeNames: ["*."+hostedZone],
            validationMethod : "DNS",
            lifecycle : {
                createBeforeDestroy: true
            },
            tags:{
                name: config.name
            }

        })

        //only one dns validation record apparently
        this._domainValidationRecords.push({
            "name": this._certificates["appsyncSslCert"].domainValidationOptions.get(0).resourceRecordName,
            "type": this._certificates["appsyncSslCert"].domainValidationOptions.get(0).resourceRecordType,
            "value": this._certificates["appsyncSslCert"].domainValidationOptions.get(0).resourceRecordValue
        })

    }
}