# Core ENV Details
export PA_ENVIRONMENT='development'
export PA_PORT=3000
export PA_DEBUG_ENABLED='1';
export PA_DOMAIN='www.pepo.com'
export PA_COOKIE_DOMAIN='127.0.0.1'

# Devops error logs framework
export DEVOPS_APP_NAME='pepo-api';
export DEVOPS_ENV_ID='dev1-sandbox';
export DEVOPS_IP_ADDRESS='127.0.0.1';

# Cache Engine
export PA_CACHE_ENGINE='memcached'
export PA_MEMCACHE_SERVERS='127.0.0.1:11211'

# Database details
export PA_MYSQL_CONNECTION_POOL_SIZE='3'

# mysql details
export PA_MYSQL_HOST='127.0.0.1'
export PA_MYSQL_USER='root'
export PA_MYSQL_PASSWORD='root'

# mysql - devops error logs infra details
export PA_INFRA_MYSQL_HOST='127.0.0.1'
export PA_INFRA_MYSQL_USER='root'
export PA_INFRA_MYSQL_PASSWORD='root'
export PA_INFRA_MYSQL_DB='ost_infra_development'

# SHA256 details
export PA_CACHE_DATA_SHA_KEY='066f7e6e833db143afee3dbafc888bcf'

# AWS-KMS details
export PA_KMS_AWS_ACCESS_KEY='AKIAJUDRALNURKAVS5IQ'
export PA_KMS_AWS_SECRET_KEY='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'
export PA_KMS_AWS_REGION='us-east-1'
export PA_API_KEY_KMS_ARN='arn:aws:kms:us-east-1:604850698061:key'
export PA_API_KEY_KMS_ID='eab8148d-fd9f-451d-9eb9-16c115645635'
export PA_SECRET_ENC_KEY_KMS_ARN='arn:aws:kms:us-east-1:604850698061:key'
export PA_SECRET_ENC_KEY_KMS_ID='eab8148d-fd9f-451d-9eb9-16c115645635'

# ost-platform API credentials
export PA_SA_API_END_POINT='https://api.stagingost.com/testnet/v2/'

# cookie signing secret
export PA_COOKIE_SECRET='aa5298d3a3fe181a3a52d085ee1525df5asa498337f8f3b76ca7df0a5de3211b'
export PA_COOKIE_TOKEN_SECRET='aa5298d3a3fe181a3a52d085ee1525df5asa498337f8f3b76ca7df0a5de3211b'

# Giphy Api Key
export PA_GIPHY_API_KEY='PbWiMCsT9RxXtatEtKp6w1vapdqNxhFQ'