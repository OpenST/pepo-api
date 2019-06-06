'use strict';

/**
 * Class for core constants
 *
 * @class
 */
class CoreConstants {
  /**
   * Constructor for core constants
   *
   * @constructor
   */
  constructor() {}

  get environment() {
    return process.env.PA_ENVIRONMENT;
  }

  get environmentShort() {
    return process.env.PA_ENVIRONMENT.substring(0, 2);
  }

  get DEBUG_ENABLED() {
    return process.env.PA_DEBUG_ENABLED;
  }

  get CACHE_ENGINE() {
    return process.env.PA_CACHE_ENGINE;
  }

  get MEMCACHE_SERVERS() {
    return process.env.PA_MEMCACHE_SERVERS.split(',');
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

  get KMS_API_KEY_ARN() {
    return process.env.PA_API_KEY_KMS_ARN;
  }

  get KMS_API_KEY_ID() {
    return process.env.PA_API_KEY_KMS_ID;
  }

  get KMS_KNOWN_ADDR_KEY_ARN() {
    return process.env.PA_KNOWN_ADDRESS_KMS_ARN;
  }

  get KMS_KNOWN_ADDR_KEY_ID() {
    return process.env.PA_KNOWN_ADDRESS_KMS_ID;
  }

  get PA_SA_API_END_POINT() {
    return process.env.PA_SA_API_END_POINT;
  }

  get PA_SA_API_KEY() {
    return process.env.PA_SA_API_KEY;
  }

  get PA_SA_API_SECRET() {
    return process.env.PA_SA_API_SECRET;
  }
}

module.exports = new CoreConstants();
