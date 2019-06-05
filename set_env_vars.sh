# Core ENV Details
export PA_ENVIRONMENT='development'

export PA_DEBUG_ENABLED='1';


# Cache Engine
export PA_CACHE_ENGINE='memcached'
export PA_MEMCACHE_SERVERS='127.0.0.1:11211'

# Database details
export PA_MYSQL_CONNECTION_POOL_SIZE='3'

# mysql details
export PA_MYSQL_HOST='127.0.0.1'
export PA_MYSQL_USER='root'
export PA_MYSQL_PASSWORD='root'

# AWS-KMS details
export SA_KMS_AWS_ACCESS_KEY='AKIAJUDRALNURKAVS5IQ'
export SA_KMS_AWS_SECRET_KEY='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'
export SA_KMS_AWS_REGION='us-east-1'
export SA_API_KEY_KMS_ARN='arn:aws:kms:us-east-1:604850698061:key'
export SA_API_KEY_KMS_ID='eab8148d-fd9f-451d-9eb9-16c115645635'
export SA_KNOWN_ADDRESS_KMS_ARN='arn:aws:kms:us-east-1:604850698061:key'
export SA_KNOWN_ADDRESS_KMS_ID='eab8148d-fd9f-451d-9eb9-16c115645635'