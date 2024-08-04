import { Construct } from 'constructs';
import { AthenaDatabase } from '@cdktf/provider-aws/lib/athena-database';
import { AthenaNamedQuery } from '@cdktf/provider-aws/lib/athena-named-query';


  //this is shared among all stacks so that dev/prodcution/etc stacks can share a hosted zone between eachother
export class Athena extends Construct {
    private _zone:any = {}
   
    get zone(){
        return this._zone
    }
   

    constructor(scope: Construct, name: string) {
        super(scope, name)
    }

    public createCloudfrontS3LogDatabase(databaseName:string, bucketName:string){
        new AthenaDatabase(this, "athena-cloudfront-log-database",{
            name: databaseName,
            bucket: bucketName
        })
    }

    public createCloudfrontS3LogTable(bucketName:string, databaseName:string, tableName:string, queryName:string){
        new AthenaNamedQuery(this, "athena-cloudfront-log-create-table-query",{
            name: queryName,
            database: databaseName,
            query: `CREATE EXTERNAL TABLE IF NOT EXISTS `+tableName+` (
                \`date\` DATE,
                time STRING,
                x_edge_location STRING,
                sc_bytes BIGINT,
                c_ip STRING,
                cs_method STRING,
                cs_host STRING,
                cs_uri_stem STRING,
                sc_status INT,
                cs_referrer STRING,
                cs_user_agent STRING,
                cs_uri_query STRING,
                cs_cookie STRING,
                x_edge_result_type STRING,
                x_edge_request_id STRING,
                x_host_header STRING,
                cs_protocol STRING,
                cs_bytes BIGINT,
                time_taken FLOAT,
                x_forwarded_for STRING,
                ssl_protocol STRING,
                ssl_cipher STRING,
                x_edge_response_result_type STRING,
                cs_protocol_version STRING,
                fle_status STRING,
                fle_encrypted_fields INT,
                c_port INT,
                time_to_first_byte FLOAT,
                x_edge_detailed_result_type STRING,
                sc_content_type STRING,
                sc_content_len BIGINT,
                sc_range_start BIGINT,
                sc_range_end BIGINT
              )
              ROW FORMAT DELIMITED 
              FIELDS TERMINATED BY '\t'
              LOCATION 's3://`+bucketName+`/'
              TBLPROPERTIES ( 'skip.header.line.count'='2' )`
        })

    }
}
