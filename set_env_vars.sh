#!/usr/bin/env bash
# Core ENV Details
export PA_ENVIRONMENT='development'
export PA_PORT=3000
export PA_DEBUG_ENABLED='1';
export PA_DOMAIN='http://pepodev.com:8080'
export PA_WEB_DOMAIN='http://test:testpasswd@pepodev.com:8080'
export PA_STORE_WEB_DOMAIN='http://test:testpasswd@store.pepodev.com:8080'
export PA_COOKIE_DOMAIN='.pepodev.com'

# Devops error logs framework
export PA_DEVOPS_APP_NAME='pepo-api';
export PA_DEVOPS_ENV_ID='dev1-sandbox';
export PA_DEVOPS_IP_ADDRESS='127.0.0.1';
export PA_DEVOPS_SERVER_IDENTIFIER='1111';

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

# mysql redemption db
export PA_REDEMPTION_DB_MYSQL_HOST='127.0.0.1'
export PA_REDEMPTION_DB_MYSQL_USER='root'
export PA_REDEMPTION_DB_MYSQL_PASSWORD='root'

#mysql transaction db
export PA_FIAT_DB_MYSQL_HOST='127.0.0.1'
export PA_FIAT_DB_MYSQL_USER='root'
export PA_FIAT_DB_MYSQL_PASSWORD='root'

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

# cookie signing secret for mobile cookie
export PA_COOKIE_SECRET='aa5298d3a3fe181a3a52d085ee1525df5asa498337f8f3b76ca7df0a5de3211b'
export PA_COOKIE_TOKEN_SECRET='aa5298d3a3fe181a3a52d085ee1525df5asa498337f8f3b76ca7df0a5de3211b'

# cookie signing secret for admin cookie
export PA_PAD_COOKIE_SECRET='aa5298d3a3fe181a3a52d085ee1525df5asa498337f8f3b76ca7df0a5de32123'

# cookie signing secret for web cookie
export PA_PW_COOKIE_SECRET='aa5298d3a3fe181a3a52d085ee1525df5asa498337f8f3b76ca7df0a5de32124'

# Pepo Campaigns Details
export PA_CAMPAIGN_CLIENT_KEY="3572cbc0d1895ed73e769d028eb50fec"
export PA_CAMPAIGN_CLIENT_SECRET="b753c5acca25e22bedb5a58efc72891a"
export PA_CAMPAIGN_BASE_URL="https://pepocampaigns.com"
export PA_CAMPAIGN_MASTER_LIST="64194"

#Twitter API Key
export PA_TWITTER_CONSUMER_KEY='NEo4gEXzdQZaoTsqzpZvepfKb'
export PA_TWITTER_CONSUMER_SECRET='iM5UMt4px8rwoqEoRV9gJGrJGtEoMUxOYkaWXSges7t4bk564t'
export PA_TWITTER_AUTH_CALLBACK_ROUTE='http://pepodev.com:8080/twitter/auth'

# image resizer variables
export PR_LAMBDA_IMAGE_RESIZE_FUNCTION='arn:aws:lambda:us-east-1:274208178423:function:pepoImageResizer'
export PR_LAMBDA_VIDEO_COMPRESS_FUNCTION='arn:aws:lambda:us-east-1:274208178423:function:pepoVideoCompressor'

export PA_EMAIL_TOKENS_DECRIPTOR_KEY='3d3w6fs0983ab6b1e37d1c1fs64hm8g9'

# Replication variables for cassandra. ONLY FOR DEVELOPMENT.
export REPLICATION_CLASS='SimpleStrategy'
export REPLICATION_FACTOR='3'

# Cassandra related variables.
export DEFAULT_REPLICATION_LEVEL='localOne'

export PA_CDN_URL='https://dbvoeb7t6hffk.cloudfront.net'
export TWITTER_OAUTH_URL='https://api.twitter.com/oauth/authorize?oauth_token='

# Pepo twitter handle
export PA_PEPO_TWITTER_HANDLE='thepepoapp'
export PA_PEPO_REDEMPTION_USER_ID='1001'

export PA_GOOGLE_INAPP_SERVICE_ACCOUNT_KEY=''
# Value for PA_GOOGLE_INAPP_SERVICE_ACCOUNT_KEY should be escaped first with escape() function. This is done so as to avoid /n being escaped automatically.
export PA_GOOGLE_INAPP_SERVICE_ACCOUNT_EMAIL=''

# Feed related constants.
export PA_USER_SEARCH_CURATED_USER_IDS='[1000]'
export PA_CURATED_FEED_IDS='[1000]'

# Slack related constants.
export PA_SLACK_OAUTH_TOKEN='xoxp-777224596644-779895340934-778717974948-a9c2624c28bc708be08cb2777474bcf1'

# Google constants
# escape while creating the env variable and unescape while usage
export PA_GOOGLE_PRIVATE_KEY='-----BEGIN%20PRIVATE%20KEY-----%0AMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDMxsHlpqlL8eTj%0A16lkEsGlDPCgzz5ll8mrmpblv8jVJb45OPX5Nko2vcsDN3Z3fpNqJO5gB7kJG22o%0AasosP/A+uvzRIv2R6EJ6SJACm/voh4qMqGyfAdg4jyFfG0ziMu80SNU62Oyxhl0E%0ADbSP/33B69zz/czBZDPQEVYJR0qyQ3bfguNKpTpljVsUVySqP9AL4SWlowSAXuju%0AniR5vDEzKeDn1mgi/I3VJK7ngRb6a0o4syttKjxjaexh835phhVpGNvsWstmGP1u%0A+ec1Xo3cSKEh1/l+j1DxbBV6Wodxk2ny+nB8TVVkB7KJgduI/Kh+6rgjybPJNIdG%0ABEmZqiGbAgMBAAECggEADTuOzhNN/11bSCnohVH893h1mD6sLo53dsJfm+sfxD5T%0AI4l9w6PxecYb91I/MouYZRSL3uLA30jJdkeoVuGu2a7lpXIYZrRWj2Ze//wqdCVG%0AG77Kfh/1Y/pD0syF1FwsPvmx5cKc0P/4xMlJ8MA21TAzsASnlZuvCXQFVkYoGorJ%0Ayg2TvFkgEazxhOUx9PZuIQH7qzh2dkPmSs3aRqhSjHKgrt/NyJm6OPbbdEBwDoxO%0AddS9yOCQfIJ+DeSn8fuQI7M7w/qLPPzpZSSR1Qes3BfK7ESPrTOmXLVgo5KxW9hX%0A5nhvJJGXILq50TtZeiILgHLR8ATSc4/vZDZoVFv3CQKBgQD8KPdUQlVvXUg4+Hwu%0A9GfAeaSG5BiXtnqsf5QhOM5Qb9ey2FIkFRS4d2TTn71Qn5iqfqihaQ48ZD1K/Cd8%0AOulYM5aIAHQTtLKvH6rNHCeVFMWButEHTCcUokauENrreySMi75hrYZq28z0j1UF%0A8Ob79y/Td2h04olfGIXcfO6TrwKBgQDP5RGGkv1BZxz7y0tnOSzs2OT9OZVyH+Nb%0AKNl3tRNIgbk8qKoBqEKyzueLyKXVhzsEquq0t0IPhxBtY3T45RNz7epU77DYPh1x%0AL3RmeCYdAIlJl4nCo12u9WVG9ES8gw37J75Jn8OcHGXej8aDLGTiPTzlGzJenQTO%0AGa3JAh4P1QKBgQCnIMvU9+ZCWpRc1i0QvgLqKnWmxhWasGKcZC6c2la8L3TKX+AJ%0AdEN4hAG61bwXbMA1+J7x5HyAAHwzb+8HwtAYGpEh8RL+YJyxv45oRcniYJMLifOz%0AH4Ejhu7LvfYrb0HpOVHk0asutiIg0cMrneCqjcoQIauFFQSxl8JZQiCqlwKBgQCl%0A/Lk/f4DhhVio2ao8onPyL0K1xBJEap12nWj0oQjibWDew7PpWtTWO0i4XN27XRuM%0AIIMBAwilqSs+i5hLWWtstlrQsge6v+11/3OqlOepZFI5BdsiIpmcJaZVPpbbBLBX%0ABWZzFjJyJGJZjuXqublawZYrPsm6rRe3Dt2ojh4+eQKBgFRJmDjERpCONzQcLqEV%0AyfsustMhryfxXJ3xYSvugmKrHuR6FOcz3JviaCSpgdF4alSRcAKrmyRR9CHqqM6I%0AN+Szqjwk0/nd0VEnRzCbKIxNBbpcCEgFEJXJjavUhZsNycTFLFluDs4AbMKjf3SJ%0A4GpJY3ZaQrdZ69H1jxjutgwe%0A-----END%20PRIVATE%20KEY-----%0A'
export PA_GOOGLE_CLIENT_EMAIL='pepo-245@lateral-avatar-205714.iam.gserviceaccount.com'
export PA_GOOGLE_PROJECT_ID='lateral-avatar-205714'
export PA_GOOGLE_USAGE_REPORT_SPREADSHEET_ID='1zB67I1MaWo8Ohw4A-yZNHbY0A9nrA1NifhdueTLUBMg'
export PA_GOOGLE_USAGE_REPORT_GROUP_IDS='{"User data Lifetime": "1969769902", "User data Last 7 days": "262285918", "User data Last 24 hours": "1492159954", "Videos Stats Lifetime": "2079750882", "Videos Stats Last 7 days": "293576976", "Videos Stats Last 24 hrs": "920797104", "Tags Used": "1756942354"}'

# Video pixel data file path
export PA_VIDEO_PIXEL_DATA_S3_FILE_PATH='redshift/full_video_watched_by_devices.csv'
export PA_VIDEO_PIXEL_DATA_APP_FILE_PATH='.'
