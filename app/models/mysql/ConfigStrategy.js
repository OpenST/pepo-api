const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  SecureGlobalSaltCache = require(rootPrefix + '/lib/cacheManagement/single/SecureGlobalSalt'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  configStrategyValidator = require(rootPrefix + '/helpers/configStrategyValidator'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

// Declare variables.
const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1),
  dbName = 'pepo_api_config_' + coreConstants.environment;

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
   * Create record of config strategy.
   *
   * @param {string} kind
   * @param {object} allParams
   * @param {number} [encryptionSaltId]: presently the id of encryption_salts table
   *
   * @returns {Promise<*>}
   */
  async create(kind, allParams, encryptionSaltId = 0) {
    const oThis = this;

    const strategyKindIntResp = configStrategyValidator.getStrategyKindInt(kind);

    if (strategyKindIntResp.isFailure()) {
      return Promise.reject(strategyKindIntResp);
    }

    const strategyKindInt = strategyKindIntResp.data;

    if (!allParams) {
      return oThis._customError('a_mo_m_cs_1', 'Config Strategy params hash cannot be null');
    }

    // Check if proper keys are present in all params
    if (!configStrategyValidator.validateConfigStrategy(kind, allParams)) {
      return oThis._customError('a_mo_m_cs_2', `Config params validation failed for: ${JSON.stringify(allParams)}`);
    }

    const separateHashesResponse = oThis._getSeparateHashes(kind, allParams);

    const hashToEncrypt = separateHashesResponse.hashToEncrypt,
      hashNotToEncrypt = separateHashesResponse.hashNotToEncrypt;

    let encryptedHash = null;

    if (hashToEncrypt) {
      const encryptedHashResponse = await oThis._getEncryption(hashToEncrypt, encryptionSaltId);

      if (encryptedHashResponse.isFailure()) {
        return oThis._customError('a_mo_m_cs_3', 'Error while encrypting data');
      }
      encryptedHash = encryptedHashResponse.data;
    }

    const hashNotToEncryptString = JSON.stringify(hashNotToEncrypt);

    const insertData = {
      kind: strategyKindInt,
      encrypted_params: encryptedHash,
      unencrypted_params: hashNotToEncryptString,
      global_salt_id: encryptionSaltId,
      status: configStrategyConstants.invertedStatuses[configStrategyConstants.inActiveStatus]
    };

    const insertResult = await oThis.insert(insertData).fire();

    return responseHelper.successWithData(insertResult.insertId);
  }

  /**
   * Encrypt params using salt.
   *
   * @param {object} paramsToEncrypt
   * @param {number} globalSaltId
   *
   * @returns {Promise<result>}
   * @private
   */
  async _getEncryption(paramsToEncrypt, globalSaltId) {
    const oThis = this;

    const response = await oThis._getDecryptedSalt(globalSaltId);

    if (response.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_mo_m_cs_4',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }

    const encryptedConfigStrategyParams = localCipher.encrypt(
      response.data.addressSalt,
      JSON.stringify(paramsToEncrypt)
    );

    return responseHelper.successWithData(encryptedConfigStrategyParams);
  }

  /**
   * Segregate encrypted and un-encrypted config hash.
   *
   * @param {string} strategyKindName
   * @param {object} configStrategyParams
   *
   * @returns {object}
   * @private
   */
  _getSeparateHashes(strategyKindName, configStrategyParams) {
    const hashToEncrypt = {},
      hashNotToEncrypt = configStrategyParams;

    const encryptedKeysFound = false;

    return {
      hashToEncrypt: encryptedKeysFound ? hashToEncrypt : null,
      hashNotToEncrypt: hashNotToEncrypt
    };
  }

  /**
   * Get decrypted config strategy salt from cache or fetch.
   *
   * @param {number} globalSaltId
   *
   * @return {Promise<result>}
   * @private
   */
  async _getDecryptedSalt(globalSaltId) {
    const secureGlobalSaltCacheObj = new SecureGlobalSaltCache({ globalSaltId: globalSaltId });

    const configSaltResp = await secureGlobalSaltCacheObj.fetch();

    if (configSaltResp.isFailure()) {
      return Promise.reject(configSaltResp);
    }

    return configSaltResp;
  }

  /**
   * Get complete config strategy hash by passing array of strategy ids.
   *
   * @param {array} ids
   *
   * @returns {Promise<Promise<never>|Promise<{}>>}
   */
  async getByIds(ids) {
    const oThis = this;

    if (ids.length === 0) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_mo_m_cs_5',
          api_error_identifier: 'empty_strategy_array',
          debug_options: {},
          error_config: errorConfig
        })
      );
    }

    const queryResult = await oThis
      .select(['id', 'encrypted_params', 'unencrypted_params', 'kind', 'global_salt_id'])
      .where(['id IN (?)', ids])
      .fire();

    const decryptedSalts = {},
      finalResult = {};

    for (let index = 0; index < queryResult.length; index++) {
      // Following logic is added so that decrypt call is not given for already decrypted salts.
      if (decryptedSalts[queryResult[index].global_salt_id] == null) {
        const response = await oThis._getDecryptedSalt(queryResult[index].global_salt_id);
        if (response.isFailure()) {
          return Promise.reject(
            responseHelper.error({
              internal_error_identifier: 'a_mo_m_cs_6',
              api_error_identifier: 'something_went_wrong',
              debug_options: {},
              error_config: errorConfig
            })
          );
        }

        decryptedSalts[queryResult[index].global_salt_id] = response.data.addressSalt;
      }

      let localDecryptedJsonObj = {};

      if (queryResult[index].encrypted_params) {
        const localDecryptedParams = localCipher.decrypt(
          decryptedSalts[queryResult[index].global_salt_id],
          queryResult[index].encrypted_params
        );
        localDecryptedJsonObj = JSON.parse(localDecryptedParams);
      }

      const configStrategyHash = JSON.parse(queryResult[index].unencrypted_params);

      localDecryptedJsonObj = oThis._mergeConfigResult(
        queryResult[index].kind,
        configStrategyHash,
        localDecryptedJsonObj
      );

      finalResult[queryResult[index].id] = localDecryptedJsonObj;
    }

    return Promise.resolve(finalResult);
  }

  /**
   * Merge config strategy result.
   *
   * @param {string} strategyKind
   * @param {object} configStrategyHash
   * @param {object} decryptedJsonObj
   *
   * @return {object}
   * @private
   */
  _mergeConfigResult(strategyKind, configStrategyHash, decryptedJsonObj) {
    /*
    NOTE: Commented this code for later use.
    if (
      kinds[strategyKind] === configStrategyConstants.dynamodb ||
      kinds[strategyKind] === configStrategyConstants.globalDynamodb ||
      kinds[strategyKind] === configStrategyConstants.originDynamodb
    ) {
      configStrategyHash[kinds[strategyKind]].apiSecret = decryptedJsonObj.dynamoApiSecret;
      configStrategyHash[kinds[strategyKind]].autoScaling.apiSecret = decryptedJsonObj.dynamoAutoscalingApiSecret;
    } else if (kinds[strategyKind] === configStrategyConstants.elasticSearch) {
      configStrategyHash[kinds[strategyKind]].apiSecret = decryptedJsonObj.esSecretKey;
    } else if (
      kinds[strategyKind] === configStrategyConstants.rabbitmq ||
      kinds[strategyKind] === configStrategyConstants.globalRabbitmq ||
      kinds[strategyKind] === configStrategyConstants.originRabbitmq ||
      kinds[strategyKind] === configStrategyConstants.webhooksPreProcessorRabbitmq ||
      kinds[strategyKind] === configStrategyConstants.webhooksProcessorRabbitmq
    ) {
      configStrategyHash[kinds[strategyKind]].password = decryptedJsonObj.rmqPassword;
    }
    */

    return configStrategyHash;
  }

  /**
   * This method updates strategy ID.
   *
   * @param {number} strategyId
   * @param {object} configStrategyParams
   *
   * @returns {Promise<*>}
   */
  async updateStrategyId(strategyId, configStrategyParams) {
    const oThis = this;

    const queryResult = await new ConfigStrategyModel()
      .select(['global_salt_id', 'kind'])
      .where({ id: strategyId })
      .fire();

    if (queryResult.length === 0) {
      return oThis._customError('a_mo_m_cs_7', 'Strategy id is invalid.');
    }

    const finalDataToInsertInDb = {},
      strategyKind = queryResult[0].kind,
      managedAddressSaltId = queryResult[0].global_salt_id,
      strategyKindName = configStrategyConstants.kinds[strategyKind];

    const validationResult = configStrategyValidator.validateConfigStrategy(strategyKindName, configStrategyParams);

    if (!validationResult) {
      return oThis._customError('a_mo_m_cs_8', 'Config validation failed');
    }

    // Segregate data to encrypt and data not to encrypt.
    const separateHashesResponse = oThis._getSeparateHashes(strategyKindName, configStrategyParams);

    const hashToEncrypt = separateHashesResponse.hashToEncrypt,
      hashNotToEncrypt = separateHashesResponse.hashNotToEncrypt;

    let encryptedHash = null;

    if (hashToEncrypt) {
      const encryptedHashResponse = await oThis._getEncryption(hashToEncrypt, managedAddressSaltId);

      if (encryptedHashResponse.isFailure()) {
        return oThis._customError('a_mo_m_cs_9', 'Error while encrypting data');
      }
      encryptedHash = encryptedHashResponse.data;
    }

    finalDataToInsertInDb.encrypted_params = encryptedHash;
    finalDataToInsertInDb.unencrypted_params = JSON.stringify(hashNotToEncrypt);

    await new ConfigStrategyModel()
      .update(finalDataToInsertInDb)
      .where({ id: strategyId })
      .fire();

    return responseHelper.successWithData({});
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
      return oThis._customError('a_mo_m_cs_10', 'Error in setStatusActive.');
    }

    if (queryResponse.affectedRows === 1) {
      logger.info(`Status of strategy id: [${id}] is now active.`);

      return responseHelper.successWithData({});
    }

    return oThis._customError('a_mo_m_cs_11', 'Strategy Id not present in the table.');
  }

  /**
   * Activate strategies by ids.
   *
   * @param {array} ids
   *
   * @returns {Promise<Promise<never>|*|result>}
   */
  async activateByIds(ids) {
    const oThis = this;

    // Update query.
    const queryResponse = await oThis
      .update({
        status: configStrategyConstants.invertedStatuses[configStrategyConstants.activeStatus]
      })
      .where(['id IN ?', ids])
      .fire();

    if (!queryResponse) {
      return oThis._customError('a_mo_m_cs_12', 'Error in setStatusActive.');
    }

    if (queryResponse.affectedRows === ids.length) {
      logger.info(`Status of strategy ids: [${ids}] is now active.`);

      return responseHelper.successWithData({});
    }

    return oThis._customError('a_mo_m_cs_13', 'Strategy Ids not present in the table.');
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
