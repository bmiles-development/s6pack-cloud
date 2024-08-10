import { Construct } from 'constructs';
import {AppsyncDomainName} from '../../../../.gen/providers/aws/appsync-domain-name'
import {AppsyncDomainNameApiAssociation} from '../../../../.gen/providers/aws/appsync-domain-name-api-association'

export class AppsyncDomainNameResource extends Construct {
    private _appsyncDomainNameResource: any = {}
    private _appsyncDomainName: any = {}
    private _hostedZoneId: any = {}
    private _roles: any = {}
    public get appsyncDomainNameResource(){
        return this._appsyncDomainNameResource
    }
    public get hostedZoneId(){
        return this._hostedZoneId
    }
    constructor(scope: Construct, name: string ) {
        super(scope, name)
    }
    public get roles() {
        return this._roles
    }

    public addAppsyncDomainName(appsyncDomainName:any, certificateArn:any, stackName:string){
        this._appsyncDomainNameResource = new AppsyncDomainName(this, stackName+"blue_green_url_appsyncDomainName", {
            domainName: appsyncDomainName,
            certificateArn : certificateArn
        })
        this._hostedZoneId = this._appsyncDomainNameResource.hostedZoneId
        this._appsyncDomainName = this._appsyncDomainNameResource.domainName
    }

    public addAppsyncDomainNameApiAssociation(graphqlApiId:any, stackName:string){
        new AppsyncDomainNameApiAssociation(this, stackName+"appsyncDomainNameApiAssociation",{
            apiId: graphqlApiId,
            domainName: this._appsyncDomainName
        })
    }

}


