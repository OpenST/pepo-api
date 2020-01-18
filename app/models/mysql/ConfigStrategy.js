const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  SecureGlobalSaltCache = require(rootPrefix + '/lib/cacheManagement/single/SecureGlobalSalt'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  globalSaltConstants = require(rootPrefix + '/lib/globalConstant/globalSalt'),
  configStrategyValidator = require(rootPrefix + '/helpers/configStrategyValidator'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

// Declare variables.
const dbName = databaseConstants.configDbName,
  errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1),
  configStrategyKinds = configStrategyConstants.kinds;

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
   *
   * @returns {Promise<*>}
   */
  async create(kind, allParams) {
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
      const encryptedHashResponse = await oThis._getEncryption(hashToEncrypt);

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
      status: configStrategyConstants.invertedStatuses[configStrategyConstants.inActiveStatus]
    };

    const insertResult = await oThis.insert(insertData).fire();

    return responseHelper.successWithData(insertResult.insertId);
  }

  /**
   * Encrypt params using salt.
   *
   * @param {object} paramsToEncrypt
   *
   * @returns {Promise<result>}
   * @private
   */
  async _getEncryption(paramsToEncrypt) {
    const oThis = this;

    const response = await oThis._getDecryptedSalt();

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

    let encryptedKeysFound = false;

    if (
      strategyKindName === configStrategyConstants.bgJobRabbitmq ||
      strategyKindName === configStrategyConstants.notificationRabbitmq ||
      strategyKindName === configStrategyConstants.webhookPreProcessorRabbitmq ||
      strategyKindName === configStrategyConstants.pepoMobileEventRabbitmq ||
      strategyKindName === configStrategyConstants.socketRabbitmq ||
      strategyKindName === configStrategyConstants.pixelRabbitmq
    ) {
      const rmqPassword = hashNotToEncrypt[strategyKindName].password;

      hashNotToEncrypt[strategyKindName].password = '{{rmqPassword}}';
      hashToEncrypt.rmqPassword = rmqPassword;
      encryptedKeysFound = true;
    } else if (strategyKindName === configStrategyConstants.websocket) {
      const wsAuthSalt = hashNotToEncrypt[strategyKindName].wsAuthSalt;

      hashNotToEncrypt[strategyKindName].wsAuthSalt = '{{wsAuthSalt}}';
      hashToEncrypt.wsAuthSalt = wsAuthSalt;
      encryptedKeysFound = true;
    } else if (strategyKindName === configStrategyConstants.cassandra) {
      const cassandraPassword = hashNotToEncrypt[strategyKindName].password;

      hashNotToEncrypt[strategyKindName].password = '{{cassandraPassword}}';
      hashToEncrypt.cassandraPassword = cassandraPassword;
      encryptedKeysFound = true;
    } else if (strategyKindName === configStrategyConstants.firebase) {
      const privateKey = hashNotToEncrypt[strategyKindName].privateKey;

      hashNotToEncrypt[strategyKindName].privateKey = '{{privateKey}}';
      hashToEncrypt.privateKey = privateKey;
      encryptedKeysFound = true;
    }

    return {
      hashToEncrypt: encryptedKeysFound ? hashToEncrypt : null,
      hashNotToEncrypt: hashNotToEncrypt
    };
  }

  /**
   * Get decrypted config strategy salt from cache or fetch.
   *
   * @return {Promise<result>}
   * @private
   */
  async _getDecryptedSalt() {
    const secureGlobalSaltCacheObj = new SecureGlobalSaltCache({
      globalSaltKind: globalSaltConstants.configStrategyKind
    });

    const configSaltResp = await secureGlobalSaltCacheObj.fetch();

    if (configSaltResp.isFailure()) {
      return Promise.reject(configSaltResp);
    }

    return configSaltResp;
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
    switch (configStrategyKinds[strategyKind]) {
      case configStrategyConstants.bgJobRabbitmq:
      case configStrategyConstants.notificationRabbitmq:
      case configStrategyConstants.webhookPreProcessorRabbitmq:
      case configStrategyConstants.pepoMobileEventRabbitmq:
      case configStrategyConstants.socketRabbitmq:
      case configStrategyConstants.pixelRabbitmq: {
        configStrategyHash[configStrategyKinds[strategyKind]].password = decryptedJsonObj.rmqPassword;
        break;
      }
      case configStrategyConstants.websocket: {
        configStrategyHash[configStrategyKinds[strategyKind]].wsAuthSalt = decryptedJsonObj.wsAuthSalt;
        break;
      }
      case configStrategyConstants.cassandra: {
        configStrategyHash[configStrategyKinds[strategyKind]].password = decryptedJsonObj.cassandraPassword;
        break;
      }
      case configStrategyConstants.firebase: {
        configStrategyHash[configStrategyKinds[strategyKind]].privateKey = decryptedJsonObj.privateKey;
        break;
      }
      default: {
        // Do nothing.
      }
    }

    return configStrategyHash;
  }

  /**
   * This method updates strategy ID.
   *
   * @param {string} strategyKind
   * @param {object} configStrategyParams
   *
   * @returns {Promise<*>}
   */
  async updateStrategyByKind(strategyKind, configStrategyParams) {
    const oThis = this;

    const strategyKindIntResp = configStrategyValidator.getStrategyKindInt(strategyKind);

    if (strategyKindIntResp.isFailure()) {
      return Promise.reject(strategyKindIntResp);
    }

    const strategyKindInt = strategyKindIntResp.data;

    const queryResult = await new ConfigStrategyModel()
      .select(['kind'])
      .where({ kind: strategyKindInt })
      .fire();

    if (queryResult.length === 0) {
      return oThis._customError('a_mo_m_cs_7', 'Strategy id is invalid.');
    }

    const finalDataToInsertInDb = {},
      configStrategyKind = queryResult[0].kind,
      strategyKindName = configStrategyConstants.kinds[configStrategyKind];

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
      const encryptedHashResponse = await oThis._getEncryption(hashToEncrypt);

      if (encryptedHashResponse.isFailure()) {
        return oThis._customError('a_mo_m_cs_9', 'Error while encrypting data');
      }
      encryptedHash = encryptedHashResponse.data;
    }

    finalDataToInsertInDb.encrypted_params = encryptedHash;
    finalDataToInsertInDb.unencrypted_params = JSON.stringify(hashNotToEncrypt);

    await new ConfigStrategyModel()
      .update(finalDataToInsertInDb)
      .where({ kind: strategyKindInt })
      .fire();

    return responseHelper.successWithData({});
  }

  /**
   * Sets the status of given strategy kind as active.
   *
   * @param {string} kind: config_strategy_kind from config_strategies table
   *
   * NOTE - inmemory cache can have old data - restart needed after usage.
   *
   * @returns {Promise<*>}
   */
  async activateByKind(kind) {
    const oThis = this;

    const strategyKindIntResp = configStrategyValidator.getStrategyKindInt(kind);

    if (strategyKindIntResp.isFailure()) {
      return Promise.reject(strategyKindIntResp);
    }

    const strategyKindInt = strategyKindIntResp.data;

    // Update query.
    const queryResponse = await oThis
      .update({
        status: configStrategyConstants.invertedStatuses[configStrategyConstants.activeStatus]
      })
      .where({ kind: strategyKindInt })
      .fire();

    if (!queryResponse) {
      return oThis._customError('a_mo_m_cs_10', 'Error in setStatusActive.');
    }

    if (queryResponse.affectedRows === 1) {
      logger.info(`Status of strategy kind: ${kind} is now active.`);

      return responseHelper.successWithData({});
    }

    return oThis._customError('a_mo_m_cs_11', 'Strategy kind not present in the table.');
  }

  /**
   * Get complete config strategy.
   *
   * @returns {result}
   */
  async getCompleteConfigStrategy() {
    const oThis = this;

    const configStrategyRows = await oThis
      .select('*')
      .where({
        status: configStrategyConstants.invertedStatuses[configStrategyConstants.activeStatus]
      })
      .fire();

    const finalResult = {};

    let decryptedSalt = null;

    for (let index = 0; index < configStrategyRows.length; index++) {
      const configStrategy = configStrategyRows[index];
      // Following logic is added so that decrypt call is not given for already decrypted salts.
      if (!decryptedSalt) {
        const response = await oThis._getDecryptedSalt();
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

        decryptedSalt = response.data.addressSalt;
      }

      let localDecryptedJsonObj = {};

      if (configStrategy.encrypted_params) {
        const localDecryptedParams = localCipher.decrypt(decryptedSalt, configStrategy.encrypted_params);
        localDecryptedJsonObj = JSON.parse(localDecryptedParams);
      }

      const configStrategyHash = JSON.parse(configStrategy.unencrypted_params);

      const mergedConfig = oThis._mergeConfigResult(configStrategy.kind, configStrategyHash, localDecryptedJsonObj);

      finalResult[configStrategyConstants.kinds[configStrategy.kind]] =
        mergedConfig[configStrategyConstants.kinds[configStrategy.kind]];
    }

    return responseHelper.successWithData(finalResult);
  }

  /**
   * Custom error.
   *
   * @param {string} errCode
   * @param {string} errMsg
   *
   * @return {Promise<never>}
   * @private
   */
  _customError(errCode, errMsg) {
    logger.error(errMsg);

    return Promise.reject(
      responseHelper.error({
        internal_error_identifier: errCode,
        api_error_identifier: 'something_went_wrong',
        debug_options: { errMsg: errMsg }
      })
    );
  }
}

module.exports = ConfigStrategyModel;
