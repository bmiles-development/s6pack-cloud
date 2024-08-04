import { Construct } from 'constructs';
import {AppsyncGraphqlApi} from '../../../../.gen/providers/aws/appsync-graphql-api'
import {AppsyncResolver} from '../../../../.gen/providers/aws/appsync-resolver'
import { AppsyncDatasource } from '@cdktf/provider-aws/lib/appsync-datasource'

export class Appsync extends Construct {
    public readonly graphqlApi: AppsyncGraphqlApi
    private _datasources: any = {}
    private _appsyncDomainName: any = {}

    public get datasources(){
        return this._datasources
    }
    public get appsyncDomainName(){
        return this._appsyncDomainName
    }

    constructor(scope: Construct, name: string, config: any, schemaFile: any, resolvers:any, appsyncServiceRoleArn: any, cognitoUserPoolId:string, cloudwatchResource:any, stackName:string) {
        super(scope, name)
        this._appsyncDomainName = config.appsyncDomainName
        this.graphqlApi = new AppsyncGraphqlApi(this, config.name+'_graphql_api', {
            name: config.name+'_graphql_api', 
            authenticationType: config.appsync.authenticationType,
            additionalAuthenticationProvider: [
                {authenticationType: config.appsync.additionalAuthenticationType}
            ],
            //lambdaAuthorizerConfig: {
            //    authorizerUri: lambdaArnForAuthorizer
            //},
            userPoolConfig : {
                awsRegion : config.region,
                defaultAction : config.appsync.defaultAction,
                userPoolId : cognitoUserPoolId
            },
            schema: schemaFile.toString(),
            logConfig: {
                cloudwatchLogsRoleArn: appsyncServiceRoleArn,
                fieldLogLevel: "ERROR"
            },
            tags: {
                name: config.name
            },
            xrayEnabled : true,
        })
        /*
        new LambdaPermission(this, stackName+"-lambdaAuthorizer", {
            statementId: stackName+"-lambdaAuthorizer",
            action: "lambda:InvokeFunction",
            principal: "appsync.amazonaws.com",
            sourceArn: lambdaArnForAuthorizer,
            functionName: lambdaFunctionNameForAuthorizer
        })*/

        cloudwatchResource.createAppsyncLogGroup(this, this.graphqlApi.id, name, stackName)

        this._datasources['STEP_FUNCTIONS'] = new AppsyncDatasource(this, config.name+'_datasource_stepfunctions', {
            name: config.name+'_datasource_stepfunctions',
            apiId : this.graphqlApi.id,
            type: "HTTP",
            serviceRoleArn: appsyncServiceRoleArn,
            httpConfig:{
                endpoint: "https://sync-states."+config.region+".amazonaws.com/",
                authorizationConfig:{
                    authorizationType: "AWS_IAM",
                    awsIamConfig: {
                        signingRegion: config.region,
                        signingServiceName: "states"
                    }
                }
            }
        })

        this._datasources['NONE'] = new AppsyncDatasource(this, config.name+'_datasource_none', {
            name: config.name+'_datasource_none',
            apiId : this.graphqlApi.id,
            type: "NONE"
        })

        //Define AppSync Resolver Files
        Object.entries(resolvers).forEach(([mkey, _mvalue], _mindex) => {
            let config:any = {}
            config['apiId'] = this.graphqlApi.id,
            config["type"] = resolvers[mkey].type
            config["field"] = resolvers[mkey].field
            config["dataSource"] = this._datasources[resolvers[mkey].datasource].name
            if(typeof resolvers[mkey].requestTemplate !== 'undefined'){
                config["requestTemplate"] = resolvers[mkey].requestTemplate
            }
            if(typeof resolvers[mkey].responseTemplate !== 'undefined'){
                config["responseTemplate"] = resolvers[mkey].responseTemplate
            }

            new AppsyncResolver(this, "resolver_"+mkey, config)
        })
        
    }   
}
