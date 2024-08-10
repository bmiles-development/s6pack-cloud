import { Construct } from 'constructs';
import { Fn, TerraformOutput } from 'cdktf';
import {Route53Record} from '@cdktf/provider-aws/lib/route53-record'
import {Route53Zone} from '@cdktf/provider-aws/lib/route53-zone'
export class Route53HostedZone extends Construct {
    private _hostedZone: string
    private _zone: any = {}
    private _sslRecordsBatches: any = {
        'appsyncSslValidationRecords': []
    }
    get hostedZone(){
        return this._hostedZone
    }
    get zone(){
        return this._zone
    }
    get sslRecordsBatches(){
        return this._sslRecordsBatches
    }

    constructor(scope: Construct, name: string, defaultRegion:string, hostedZone:string, sesMailDomain:string, sesResource:any, acmResource:any) {
        super(scope, name)
        this._hostedZone = hostedZone
        
        this._zone = new Route53Zone(scope, name+"-"+hostedZone, {
            name : hostedZone
        })

        new Route53Record(this, name+"-"+hostedZone+"-ses-verification-token", {
            zoneId: this._zone.id,
            name: "_amazonses."+hostedZone,
            type: "TXT",
            ttl : 300,
            records : [sesResource.verificationToken]
        })
        new Route53Record(this, name+"-"+hostedZone+"-ses-mx-record", {
            zoneId: this._zone.id,
            name: sesMailDomain,
            type: "MX",
            ttl : 300,
            records : ["10 feedback-smtp."+defaultRegion+".amazonses.com"]
        })
        new Route53Record(this, name+"-"+hostedZone+"-ses-txt-record", {
            zoneId: this._zone.id,
            name: sesMailDomain,
            type: "TXT",
            ttl : 300,
            records : ["v=spf1 include:amazonses.com ~all"]
        })
        new Route53Record(this, name+"-"+hostedZone+"ses-dkim-record-1", {
            zoneId: this._zone.id,
            name: Fn.element(sesResource.dkim.dkimTokens,0)+"._domainkey",
            type: "CNAME",
            ttl: 600,
            records: [Fn.element(sesResource.dkim.dkimTokens,0)+".dkim.amazonses.com"]
        })
        new Route53Record(this, name+"-"+hostedZone+"-ses-dkim-record-2", {
            zoneId: this._zone.id,
            name: Fn.element(sesResource.dkim.dkimTokens,1)+"._domainkey",
            type: "CNAME",
            ttl: 600,
            records: [Fn.element(sesResource.dkim.dkimTokens,1)+".dkim.amazonses.com"]
        })
        new Route53Record(this, name+"-"+hostedZone+"-ses-dkim-record-3", {
            zoneId: this._zone.id,
            name: Fn.element(sesResource.dkim.dkimTokens,2)+"._domainkey",
            type: "CNAME",
            ttl: 600,
            records: [Fn.element(sesResource.dkim.dkimTokens,2)+".dkim.amazonses.com"]
        })
        //acm certificate DNS validation record (apparently only one is added)
        Object.entries(acmResource.domainValidationRecords).forEach(([key, _value], _index) => {
            this._sslRecordsBatches['appsyncSslValidationRecords'][key] = new Route53Record(scope, name+"-"+this._hostedZone+"-appsync-ssl-validation-records-"+key, {
                zoneId: this._zone.id,
                name: acmResource._domainValidationRecords[key]["name"],
                type: acmResource._domainValidationRecords[key]["type"],
                ttl: 60,
                records: [acmResource._domainValidationRecords[key]["value"]]
            })
        })
        new TerraformOutput(this, "DNSRecordsForNameserver", {value: this._zone.nameServers})
    }

    /*
    public addblueGreenToggleStackDNS(globalConfig:any, blueGreenConfig:any){
        new Route53Record(this, globalConfig.hostedZone+"blue-green-toggle", {
            zoneId: this._zone.id,
            name: globalConfig.graphqlApiUrl,
            type: "CNAME",
            ttl: 60,
            records: [blueGreenConfig.appsyncDomainName]
        })
    }

    
    public addStripeWebhookLambdaUrlDomain(webhookSubDomainName:string, lambdaFunctionUrl:string){

        return new Route53Record(this, webhookSubDomainName+"-lambdaWebhook-domain", {
            zoneId: this._zone.id,
            name: webhookSubDomainName,
            type: "CNAME",
            ttl: 60,
            records: [lambdaFunctionUrl]
        })

        //new TerraformOutput(this, 'LambdaFunctionUrl-'+webhookSubDomainName, { value: lambdaFunctionUrl })
    }*/
}