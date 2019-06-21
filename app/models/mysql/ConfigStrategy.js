const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  KmsWrapper = require(rootPrefix + '/lib/authentication/KmsWrapper'),
  InMemoryCacheProvider = require(rootPrefix + '/lib/providers/inMemoryCache'),
  SecureGlobalSaltCache = require(rootPrefix + '/lib/cacheManagement/single/SecureGlobalSalt'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  kmsPurposeConstants = require(rootPrefix + '/lib/globalConstant/kms'),
  globalSaltConstants = require(rootPrefix + '/lib/globalConstant/globalSalt'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

// Declare variables.
const kinds = configStrategyConstants.kinds,
  invertedKinds = configStrategyConstants.invertedKinds,
  errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1),
  dbName = 'pepo_api_config_' + coreConstants.environment,
  encryptionPurpose = kmsPurposeConstants.configStrategyEncryptionPurpose;

/**
 * Class for config strategy model.
 *
 * @class ConfigStrategyModel
 */
class ConfigStrategyModel extends ModelBase {
  /**
   * Constructor for config strategy model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'config_strategies';
  }

  /**
   * Get decrypted config strategy salt from cache or fetch.
   *
   * @param {number} globalSaltId
   *
   * @return {Promise<string>}
   */
  async getDecryptedSalt(globalSaltId) {
    const secureGlobalSaltCacheObj = new SecureGlobalSaltCache({ globalSaltId: globalSaltId });

    const configSaltResp = await secureGlobalSaltCacheObj.fetch();

    if (configSaltResp.isFailure()) {
      return Promise.reject(configSaltResp);
    }

    return configSaltResp.data.addressSalt;
  }

  /**
   * Sets the status of given strategy id as active.
   *
   * @param {number} id: config_strategy_id from config_strategies table
   *
   * @returns {Promise<*>}
   */
  async activateById(id) {
    const oThis = this;

    // Update query.
    const queryResponse = await oThis
      .update({
        status: configStrategyConstants.invertedStatuses[configStrategyConstants.activeStatus]
      })
      .where({ id: id })
      .fire();

    if (!queryResponse) {
      return oThis._customError('a_m_m_cs_1', 'Error in setStatusActive.');
    }

    if (queryResponse.affectedRows === 1) {
      logger.info(`Status of strategy id: [${id}] is now active.`);

      return Promise.resolve(responseHelper.successWithData({}));
    }

    return oThis._customError('a_m_m_cs_2', 'Strategy Id not present in the table.');
  }

  /**
   * Custom error.
   *
   * @param {string} errCode
   * @param {string} errMsg
   *
   * @returns {Promise<never>}
   * @private
   */
  _customError(errCode, errMsg) {
    logger.error(errMsg);

    return Promise.reject(
      responseHelper.error({
        internal_error_identifier: errCode,
        api_error_identifier: 'something_went_wrong',
        debug_options: { errMsg: errMsg },
        error_config: errorConfig
      })
    );
  }
}

module.exports = ConfigStrategyModel;
