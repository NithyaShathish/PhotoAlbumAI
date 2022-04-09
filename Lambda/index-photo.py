import json
import os
import time
import logging
import boto3
from datetime import datetime
from elasticsearch import Elasticsearch, RequestsHttpConnection

from aws_requests_auth.aws_auth import AWSRequestsAuth

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

credentials = boto3.Session().get_credentials()
host = "search-photo-7744quzsewabxlojkk4t33xrri.us-east-1.es.amazonaws.com"
awsauth = AWSRequestsAuth(aws_access_key="AKIAQXVYZVJLVHBDLSGM",
                      aws_secret_access_key="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",
                      aws_host=host,
                      aws_region='us-east-1',
                      aws_service='es')

# awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)

rekognition=boto3.client('rekognition',region_name='us-east-1')


es = Elasticsearch(
    hosts=[{'host': host, 'port': 443}],
    http_auth = awsauth,
    use_ssl = True,
    verify_certs = True,
    connection_class = RequestsHttpConnection
)



def lambda_handler(event, context):
    print(event)

    os.environ['TZ'] = 'America/New_York'
    time.tzset()

    logger.debug(credentials)
    logger.debug(event)
    records = event['Records']
    #print(records)

    for record in records:

        s3object = record['s3']
        bucket = s3object['bucket']['name']
        objectKey = s3object['object']['key']

        image = {
            'S3Object' : {
                'Bucket' : bucket,
                'Name' : objectKey
            }
        }
        
        print(image)

        response = rekognition.detect_labels(Image = image)
        labels = list(map(lambda x : x['Name'], response['Labels']))
        timestamp = datetime.now().strftime('%Y-%d-%mT%H:%M:%S')

        esObject = json.dumps({
            'objectKey' : objectKey,
            'bucket' : bucket,
            'createdTimesatamp' : timestamp,
            'labels' : labels
        })

        es.index(index = "photos", doc_type = "Photo", id = objectKey, body = esObject, refresh = True)


    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
