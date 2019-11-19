/**
 * Class for core constants.
 *
 * @class CoreConstants
 */
class CoreConstants {
  get environment() {
    return process.env.PA_ENVIRONMENT;
  }

  get environmentShort() {
    return process.env.PA_ENVIRONMENT.substring(0, 2);
  }

  get DEFAULT_LOG_LEVEL() {
    return process.env.PA_DEFAULT_LOG_LEVEL;
  }

  get APP_NAME() {
    return process.env.PA_DEVOPS_APP_NAME;
  }

  get PA_WEB_DOMAIN() {
    return process.env.PA_WEB_DOMAIN;
  }

  get PA_STORE_WEB_DOMAIN() {
    return process.env.PA_STORE_WEB_DOMAIN;
  }

  get PA_DOMAIN() {
    return process.env.PA_DOMAIN;
  }

  get PA_STORE_DOMAIN() {
    return process.env.PA_STORE_DOMAIN;
  }

  get PA_INVITE_DOMAIN() {
    return process.env.PA_INVITE_DOMAIN;
  }

  get PA_COOKIE_DOMAIN() {
    return process.env.PA_COOKIE_DOMAIN;
  }

  // MySql constants.
  get MYSQL_CONNECTION_POOL_SIZE() {
    return process.env.PA_MYSQL_CONNECTION_POOL_SIZE;
  }

  // Main db
  get MAIN_DB_MYSQL_HOST() {
    return process.env.PA_MAIN_DB_MYSQL_HOST;
  }

  get MAIN_DB_MYSQL_USER() {
    return process.env.PA_MAIN_DB_MYSQL_USER;
  }

  get MAIN_DB_MYSQL_PASSWORD() {
    return process.env.PA_MAIN_DB_MYSQL_PASSWORD;
  }

  // User db.
  get USER_DB_MYSQL_HOST() {
    return process.env.PA_USER_DB_MYSQL_HOST;
  }

  get USER_DB_MYSQL_USER() {
    return process.env.PA_USER_DB_MYSQL_USER;
  }

  get USER_DB_MYSQL_PASSWORD() {
    return process.env.PA_USER_DB_MYSQL_PASSWORD;
  }

  // Big db.
  get BIG_DB_MYSQL_HOST() {
    return process.env.PA_BIG_DB_MYSQL_HOST;
  }

  get BIG_DB_MYSQL_USER() {
    return process.env.PA_BIG_DB_MYSQL_USER;
  }

  get BIG_DB_MYSQL_PASSWORD() {
    return process.env.PA_BIG_DB_MYSQL_PASSWORD;
  }

  // Entity db.
  get ENTITY_DB_MYSQL_HOST() {
    return process.env.PA_ENTITY_DB_MYSQL_HOST;
  }

  get ENTITY_DB_MYSQL_USER() {
    return process.env.PA_ENTITY_DB_MYSQL_USER;
  }

  get ENTITY_DB_MYSQL_PASSWORD() {
    return process.env.PA_ENTITY_DB_MYSQL_PASSWORD;
  }

  // Twitter db.
  get TWITTER_DB_MYSQL_HOST() {
    return process.env.PA_TWITTER_DB_MYSQL_HOST;
  }

  get TWITTER_DB_MYSQL_USER() {
    return process.env.PA_TWITTER_DB_MYSQL_USER;
  }

  get TWITTER_DB_MYSQL_PASSWORD() {
    return process.env.PA_TWITTER_DB_MYSQL_PASSWORD;
  }

  // Feed db.
  get FEED_DB_MYSQL_HOST() {
    return process.env.PA_FEED_DB_MYSQL_HOST;
  }

  get FEED_DB_MYSQL_USER() {
    return process.env.PA_FEED_DB_MYSQL_USER;
  }

  get FEED_DB_MYSQL_PASSWORD() {
    return process.env.PA_FEED_DB_MYSQL_PASSWORD;
  }

  // Config db.
  get CONFIG_DB_MYSQL_HOST() {
    return process.env.PA_CONFIG_DB_MYSQL_HOST;
  }

  get CONFIG_DB_MYSQL_USER() {
    return process.env.PA_CONFIG_DB_MYSQL_USER;
  }

  get CONFIG_DB_MYSQL_PASSWORD() {
    return process.env.PA_CONFIG_DB_MYSQL_PASSWORD;
  }

  // Ost db.
  get OST_DB_MYSQL_HOST() {
    return process.env.PA_OST_DB_MYSQL_HOST;
  }

  get OST_DB_MYSQL_USER() {
    return process.env.PA_OST_DB_MYSQL_USER;
  }

  get OST_DB_MYSQL_PASSWORD() {
    return process.env.PA_OST_DB_MYSQL_PASSWORD;
  }

  // Socket db.
  get SOCKET_DB_MYSQL_HOST() {
    return process.env.PA_SOCKET_DB_MYSQL_HOST;
  }

  get SOCKET_DB_MYSQL_USER() {
    return process.env.PA_SOCKET_DB_MYSQL_USER;
  }

  get SOCKET_DB_MYSQL_PASSWORD() {
    return process.env.PA_SOCKET_DB_MYSQL_PASSWORD;
  }

  // Infra db.
  get INFRA_DB_MYSQL_HOST() {
    return process.env.PA_INFRA_DB_MYSQL_HOST;
  }

  get INFRA_DB_MYSQL_USER() {
    return process.env.PA_INFRA_DB_MYSQL_USER;
  }

  get INFRA_DB_MYSQL_PASSWORD() {
    return process.env.PA_INFRA_DB_MYSQL_PASSWORD;
  }

  get INFRA_DB_MYSQL_DB() {
    return process.env.PA_INFRA_DB_MYSQL_DB;
  }

  // Fiat db.

  get FIAT_DB_MYSQL_HOST() {
    return process.env.PA_FIAT_DB_MYSQL_HOST;
  }

  get FIAT_DB_MYSQL_USER() {
    return process.env.PA_FIAT_DB_MYSQL_USER;
  }

  get FIAT_DB_MYSQL_PASSWORD() {
    return process.env.PA_FIAT_DB_MYSQL_PASSWORD;
  }

  // Admin db
  get ADMIN_DB_MYSQL_HOST() {
    return process.env.PA_ADMIN_DB_MYSQL_HOST;
  }

  get ADMIN_DB_MYSQL_USER() {
    return process.env.PA_ADMIN_DB_MYSQL_USER;
  }

  get ADMIN_DB_MYSQL_PASSWORD() {
    return process.env.PA_ADMIN_DB_MYSQL_PASSWORD;
  }

  // Redemption db.
  get REDEMPTION_DB_MYSQL_HOST() {
    return process.env.PA_REDEMPTION_DB_MYSQL_HOST;
  }

  get REDEMPTION_DB_MYSQL_USER() {
    return process.env.PA_REDEMPTION_DB_MYSQL_USER;
  }

  get REDEMPTION_DB_MYSQL_PASSWORD() {
    return process.env.PA_REDEMPTION_DB_MYSQL_PASSWORD;
  }

  // KMS related constants.
  get KMS_AWS_ACCESS_KEY() {
    return process.env.PA_KMS_AWS_ACCESS_KEY;
  }

  get KMS_AWS_SECRET_KEY() {
    return process.env.PA_KMS_AWS_SECRET_KEY;
  }

  get KMS_AWS_REGION() {
    return process.env.PA_KMS_AWS_REGION;
  }

  get KMS_API_KEY_ID() {
    return process.env.PA_API_KEY_KMS_ID;
  }

  get KMS_SECRET_ENC_KEY_ID() {
    return process.env.PA_SECRET_ENC_KEY_KMS_ID;
  }

  // S3 AWS config.
  get AWS_ACCESS_KEY() {
    return process.env.PA_S3_AWS_ACCESS_KEY;
  }

  get AWS_SECRET_KEY() {
    return process.env.PA_S3_AWS_SECRET_KEY;
  }

  get AWS_REGION() {
    return process.env.PA_S3_AWS_REGION;
  }

  get S3_AWS_MASTER_FOLDER() {
    return process.env.PA_S3_AWS_MASTER_FOLDER;
  }

  get S3_USER_ASSETS_BUCKET() {
    return process.env.PA_S3_USER_ASSETS_BUCKET;
  }

  get S3_USER_ASSETS_FOLDER() {
    const oThis = this;

    return oThis.S3_AWS_MASTER_FOLDER + '/' + 'ua';
  }

  get S3_USER_IMAGES_FOLDER() {
    const oThis = this;

    return oThis.S3_USER_ASSETS_FOLDER + oThis.IMAGES_S3_FOLDER;
  }

  get S3_USER_VIDEOS_FOLDER() {
    const oThis = this;

    return oThis.S3_USER_ASSETS_FOLDER + oThis.VIDEOS_S3_FOLDER;
  }

  get IMAGES_S3_FOLDER() {
    return '/images';
  }

  get VIDEOS_S3_FOLDER() {
    return '/videos';
  }

  // Encryption secrets.
  get CACHE_SHA_KEY() {
    return process.env.PA_CACHE_DATA_SHA_KEY;
  }

  get COOKIE_SECRET() {
    return process.env.PA_COOKIE_SECRET;
  }

  get ADMIN_COOKIE_SECRET() {
    return process.env.PA_PAD_COOKIE_SECRET;
  }

  get WEB_COOKIE_SECRET() {
    return process.env.PA_PW_COOKIE_SECRET;
  }

  get PA_COOKIE_TOKEN_SECRET() {
    return process.env.PA_COOKIE_TOKEN_SECRET;
  }

  // SaaS API details.
  get PA_SA_API_END_POINT() {
    return process.env.PA_SA_API_END_POINT;
  }

  // DevOps error logs framework details.
  get ENV_IDENTIFIER() {
    return process.env.PA_DEVOPS_ENV_ID;
  }

  get IP_ADDRESS() {
    return process.env.PA_DEVOPS_IP_ADDRESS;
  }

  get WS_SERVER_IDENTIFIER() {
    return process.env.PA_DEVOPS_SERVER_IDENTIFIER;
  }

  // Pepo-campaigns details.
  get PEPO_CAMPAIGN_BASE_URL() {
    return process.env.PA_CAMPAIGN_BASE_URL;
  }

  get PEPO_CAMPAIGN_CLIENT_KEY() {
    return process.env.PA_CAMPAIGN_CLIENT_KEY;
  }

  get PEPO_CAMPAIGN_CLIENT_SECRET() {
    return process.env.PA_CAMPAIGN_CLIENT_SECRET;
  }

  get PEPO_CAMPAIGN_MASTER_LIST() {
    return process.env.PA_CAMPAIGN_MASTER_LIST;
  }

  // Twitter API key and secret.
  get TWITTER_CONSUMER_KEY() {
    return process.env.PA_TWITTER_CONSUMER_KEY;
  }

  get TWITTER_CONSUMER_SECRET() {
    return process.env.PA_TWITTER_CONSUMER_SECRET;
  }

  get TWITTER_AUTH_CALLBACK_ROUTE() {
    return process.env.PA_TWITTER_AUTH_CALLBACK_ROUTE;
  }

  get PR_IMAGE_RESIZE_FUNCTION() {
    return process.env.PR_LAMBDA_IMAGE_RESIZE_FUNCTION;
  }

  get PR_VIDEO_COMPRESS_FUNCTION() {
    return process.env.PR_LAMBDA_VIDEO_COMPRESS_FUNCTION;
  }

  get PA_EMAIL_TOKENS_DECRIPTOR_KEY() {
    return process.env.PA_EMAIL_TOKENS_DECRIPTOR_KEY;
  }

  get PA_CDN_URL() {
    return process.env.PA_CDN_URL;
  }

  get PA_CDN_DISTRIBUTION_ID() {
    return process.env.PA_CDN_DISTRIBUTION_ID;
  }

  // Cassandra related constants.
  get CASSANDRA_REPLICATION_CLASS() {
    return process.env.REPLICATION_CLASS;
  }

  get CASSANDRA_REPLICATION_FACTOR() {
    return process.env.REPLICATION_FACTOR;
  }

  get CASSANDRA_REPLICATION_LEVEL() {
    return process.env.DEFAULT_REPLICATION_LEVEL;
  }

  get TWITTER_OAUTH_URL() {
    return process.env.TWITTER_OAUTH_URL;
  }

  get PEPO_TWITTER_HANDLE() {
    return process.env.PA_PEPO_TWITTER_HANDLE;
  }

  get PEPO_REDEMPTION_USER_ID() {
    return process.env.PA_PEPO_REDEMPTION_USER_ID;
  }

  get PEPO_USER_SEARCH_CURATED_USER_IDS() {
    return process.env.PA_USER_SEARCH_CURATED_USER_IDS;
  }

  get PEPO_USER_SEARCH_TOP_USER_IDS() {
    return process.env.PA_USER_SEARCH_TOP_USER_IDS;
  }

  get PEPO_TAG_SEARCH_CURATED_TAG_IDS() {
    return process.env.PA_CURATED_TAG_IDS;
  }

  get PEPO_TAG_SEARCH_TOP_TAG_IDS() {
    return process.env.PA_TOP_TAG_IDS;
  }

  get PEPO_SLACK_OAUTH_TOKEN() {
    return process.env.PA_SLACK_OAUTH_TOKEN;
  }

  get PEPO_CURATED_FEED_IDS() {
    return process.env.PA_CURATED_FEED_IDS;
  }

  get PA_GOOGLE_CLIENT_EMAIL() {
    return process.env.PA_GOOGLE_CLIENT_EMAIL;
  }

  get PA_GOOGLE_PRIVATE_KEY() {
    return process.env.PA_GOOGLE_PRIVATE_KEY;
  }

  get PA_GOOGLE_PROJECT_ID() {
    return process.env.PA_GOOGLE_PROJECT_ID;
  }

  get PA_GOOGLE_USAGE_REPORT_SPREADSHEET_ID() {
    return process.env.PA_GOOGLE_USAGE_REPORT_SPREADSHEET_ID;
  }

  get PA_GOOGLE_USAGE_REPORT_GROUP_IDS() {
    return process.env.PA_GOOGLE_USAGE_REPORT_GROUP_IDS;
  }

  get PA_VIDEO_PIXEL_DATA_S3_FILE_PATH() {
    return process.env.PA_VIDEO_PIXEL_DATA_S3_FILE_PATH;
  }

  get PA_VIDEO_PIXEL_DATA_APP_FILE_PATH() {
    return process.env.PA_VIDEO_PIXEL_DATA_APP_FILE_PATH;
  }
}

module.exports = new CoreConstants();
