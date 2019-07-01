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

  get DEBUG_ENABLED() {
    return process.env.PA_DEBUG_ENABLED;
  }

  get APP_NAME() {
    return process.env.DEVOPS_APP_NAME;
  }

  get PA_DOMAIN() {
    return process.env.PA_DOMAIN;
  }

  get PA_COOKIE_DOMAIN() {
    return process.env.PA_COOKIE_DOMAIN;
  }

  // MYSQL related details

  get PEPO_API_MYSQL_DB() {
    return process.env.PEPO_API_MYSQL_DB;
  }

  get MYSQL_CONNECTION_POOL_SIZE() {
    return process.env.PA_MYSQL_CONNECTION_POOL_SIZE;
  }

  get MYSQL_HOST() {
    return process.env.PA_MYSQL_HOST;
  }

  get MYSQL_USER() {
    return process.env.PA_MYSQL_USER;
  }

  get MYSQL_PASSWORD() {
    return process.env.PA_MYSQL_PASSWORD;
  }

  get CONFIG_ENV_MYSQL_HOST() {
    return process.env.PA_CONFIG_ENV_MYSQL_HOST;
  }

  get CONFIG_ENV_MYSQL_USER() {
    return process.env.PA_CONFIG_ENV_MYSQL_USER;
  }

  get CONFIG_ENV_MYSQL_PASSWORD() {
    return process.env.PA_CONFIG_ENV_MYSQL_PASSWORD;
  }

  // Mysql ost infra related details

  get INFRA_MYSQL_HOST() {
    return process.env.PA_INFRA_MYSQL_HOST;
  }

  get INFRA_MYSQL_USER() {
    return process.env.PA_INFRA_MYSQL_USER;
  }

  get INFRA_MYSQL_PASSWORD() {
    return process.env.PA_INFRA_MYSQL_PASSWORD;
  }

  get INFRA_MYSQL_DB() {
    return process.env.PA_INFRA_MYSQL_DB;
  }

  // kms related constants

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

  /**
   * S3 AWS config
   */
  get S3_AWS_ACCESS_KEY() {
    return process.env.PA_S3_AWS_ACCESS_KEY;
  }

  get S3_AWS_SECRET_KEY() {
    return process.env.PA_S3_AWS_SECRET_KEY;
  }

  get S3_AWS_REGION() {
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

  get S3_USER_PROFILE_IMAGES() {
    const oThis = this;

    return oThis.S3_USER_ASSETS_FOLDER + '/' + 'profile-images';
  }

  // Encryption Secrets

  get CACHE_SHA_KEY() {
    return process.env.PA_CACHE_DATA_SHA_KEY;
  }

  get COOKIE_SECRET() {
    return process.env.PA_COOKIE_SECRET;
  }

  get PA_COOKIE_TOKEN_SECRET() {
    return process.env.PA_COOKIE_TOKEN_SECRET;
  }

  // SaaS api details

  get PA_SA_API_END_POINT() {
    return process.env.PA_SA_API_END_POINT;
  }

  // Giphy api details

  get GIPHY_API_KEY() {
    return process.env.PA_GIPHY_API_KEY;
  }

  // Devops error logs framework details

  get ENV_IDENTIFIER() {
    return process.env.DEVOPS_ENV_ID;
  }

  get IP_ADDRESS() {
    return process.env.DEVOPS_IP_ADDRESS;
  }

  //Twitter API key and secret
  get TWITTER_CONSUMER_KEY() {
    return process.env.PA_TWITTER_CONSUMER_KEY;
  }

  get TWITTER_CONSUMER_SECRET() {
    return process.env.PA_TWITTER_CONSUMER_SECRET;
  }

  get TWITTER_AUTH_CALLBACK_ROUTE() {
    return process.env.PA_TWITTER_AUTH_CALLBACK_ROUTE;
  }
}

module.exports = new CoreConstants();
