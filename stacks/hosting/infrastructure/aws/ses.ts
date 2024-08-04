import { Construct } from 'constructs';
import {SesDomainIdentity} from '@cdktf/provider-aws/lib/ses-domain-identity'
import {SesIdentityPolicy} from '@cdktf/provider-aws/lib/ses-identity-policy'
import {SesDomainDkim} from '@cdktf/provider-aws/lib/ses-domain-dkim'
import {SesDomainMailFrom} from '@cdktf/provider-aws/lib/ses-domain-mail-from'
  
  export class Ses extends Construct {
    private _domainIdentity : any
    private _emailIdentity : any
    private _verificationToken: any
    private _dkim: any

    get dkim(){
      return this._dkim
    }

    get emailIdentity(){
      return this._emailIdentity
    }

    get domainIdentity(){
        return this._domainIdentity
    }

    get verificationToken(){
      return this._verificationToken
    }

    constructor(scope: Construct, name: string, globalConfig:any, sesIdentityPolicy:string) {
        super(scope, name);

        this._domainIdentity = new SesDomainIdentity(this, "domainIdentity", {
            domain: globalConfig.hostedZone
        })

        new SesIdentityPolicy(this, "identityPolicy", {
          name: "identity_policy",
          identity: this._domainIdentity.arn,
          policy: sesIdentityPolicy
        })

        this._dkim = new SesDomainDkim(this, "sesDkim", {
          domain: globalConfig.hostedZone
        })
    
        new SesDomainMailFrom(this, "mailFrom-hostedZone",{
          domain: globalConfig.hostedZone,
          mailFromDomain: globalConfig.sesMailDomain 
        })

        this._verificationToken = this._domainIdentity.verificationToken

    }
  }