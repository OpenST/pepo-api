#!/usr/bin/env bash
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
export DEVOPS_SERVER_IDENTIFIER='1111';

# Database details
export PA_MYSQL_CONNECTION_POOL_SIZE='3'

# mysql main db
export PA_MAIN_DB_MYSQL_HOST='127.0.0.1'
export PA_MAIN_DB_MYSQL_USER='root'
export PA_MAIN_DB_MYSQL_PASSWORD='root'

# mysql user db
export PA_USER_DB_MYSQL_HOST='127.0.0.1'
export PA_USER_DB_MYSQL_USER='root'
export PA_USER_DB_MYSQL_PASSWORD='root'

# mysql big db
export PA_BIG_DB_MYSQL_HOST='127.0.0.1'
export PA_BIG_DB_MYSQL_USER='root'
export PA_BIG_DB_MYSQL_PASSWORD='root'

# mysql entity db
export PA_ENTITY_DB_MYSQL_HOST='127.0.0.1'
export PA_ENTITY_DB_MYSQL_USER='root'
export PA_ENTITY_DB_MYSQL_PASSWORD='root'

# mysql twitter db
export PA_TWITTER_DB_MYSQL_HOST='127.0.0.1'
export PA_TWITTER_DB_MYSQL_USER='root'
export PA_TWITTER_DB_MYSQL_PASSWORD='root'

# mysql feed db
export PA_FEED_DB_MYSQL_HOST='127.0.0.1'
export PA_FEED_DB_MYSQL_USER='root'
export PA_FEED_DB_MYSQL_PASSWORD='root'

# mysql config db
export PA_CONFIG_DB_MYSQL_HOST='127.0.0.1'
export PA_CONFIG_DB_MYSQL_USER='root'
export PA_CONFIG_DB_MYSQL_PASSWORD='root'

# mysql ost db
export PA_OST_DB_MYSQL_HOST='127.0.0.1'
export PA_OST_DB_MYSQL_USER='root'
export PA_OST_DB_MYSQL_PASSWORD='root'

#mysql socket db
export PA_SOCKET_DB_MYSQL_HOST='127.0.0.1'
export PA_SOCKET_DB_MYSQL_USER='root'
export PA_SOCKET_DB_MYSQL_PASSWORD='root'

# mysql admin db
export PA_ADMIN_DB_MYSQL_HOST='127.0.0.1'
export PA_ADMIN_DB_MYSQL_USER='root'
export PA_ADMIN_DB_MYSQL_PASSWORD='root'

# mysql - devops error logs infra details
export PA_INFRA_DB_MYSQL_HOST='127.0.0.1'
export PA_INFRA_DB_MYSQL_USER='root'
export PA_INFRA_DB_MYSQL_PASSWORD='root'
export PA_INFRA_DB_MYSQL_DB='ost_infra_development'

# SHA256 details
export PA_CACHE_DATA_SHA_KEY='066f7e6e833db143afee3dbafc888bcf'

# AWS-KMS details
export PA_KMS_AWS_ACCESS_KEY='AKIAT7WAUYD3XA7WRZV4'
export PA_KMS_AWS_SECRET_KEY='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'
export PA_KMS_AWS_REGION='us-east-1'
export PA_API_KEY_KMS_ID='74f6ceff-95be-4c43-b936-f0c2cf6863d0'
export PA_SECRET_ENC_KEY_KMS_ID='ce7424c5-56cf-48ed-9202-49cbae0cf9d1'

# S3 config details
export PA_S3_AWS_ACCESS_KEY='AKIAT7WAUYD3XA7WRZV4'
export PA_S3_AWS_SECRET_KEY='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'
export PA_S3_AWS_REGION='us-east-1'
export PA_S3_AWS_MASTER_FOLDER='d'
export PA_S3_USER_ASSETS_BUCKET='uassets.stagingpepo.com'

# ost-platform API credentials
export PA_SA_API_END_POINT='https://api.stagingost.com/testnet/v2/'

# cookie signing secret
export PA_COOKIE_SECRET='aa5298d3a3fe181a3a52d085ee1525df5asa498337f8f3b76ca7df0a5de3211b'
export PA_COOKIE_TOKEN_SECRET='aa5298d3a3fe181a3a52d085ee1525df5asa498337f8f3b76ca7df0a5de3211b'

# Giphy Api Key
export PA_GIPHY_API_KEY='PbWiMCsT9RxXtatEtKp6w1vapdqNxhFQ'

# Pepo Campaigns Details
export PA_CAMPAIGN_CLIENT_KEY="f395013cc8715f72ecef978248d933e6"
export PA_CAMPAIGN_CLIENT_SECRET="818506e0d00c33f84099744461b41ac5"
export PA_CAMPAIGN_BASE_URL="https://pepocampaigns.com/"
export PA_CAMPAIGN_MASTER_LIST="5346"

#Twitter API Key
export PA_TWITTER_CONSUMER_KEY='NEo4gEXzdQZaoTsqzpZvepfKb'
export PA_TWITTER_CONSUMER_SECRET='iM5UMt4px8rwoqEoRV9gJGrJGtEoMUxOYkaWXSges7t4bk564t'
export PA_TWITTER_AUTH_CALLBACK_ROUTE='https://pepo.com'

# image resizer variables
export PR_LAMBDA_IMAGE_RESIZE_FUNCTION='arn:aws:lambda:us-east-1:274208178423:function:pepoImageResizer'
export PR_LAMBDA_VIDEO_COMPRESS_FUNCTION='arn:aws:lambda:us-east-1:274208178423:function:pepoVideoCompressor'

# Replication variables for cassandra. ONLY FOR DEVELOPMENT.
export REPLICATION_CLASS='SimpleStrategy'
export REPLICATION_FACTOR='3'

# Cassandra related variables.
export DEFAULT_REPLICATION_LEVEL='localOne'

export PA_CDN_URL='https://dbvoeb7t6hffk.cloudfront.net'
