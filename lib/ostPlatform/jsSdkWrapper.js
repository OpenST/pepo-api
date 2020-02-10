const OSTSDK = require('@ostdotcom/ost-sdk-js');

const rootPrefix = '../..',
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class for ost-sdk-js wrapper.
 *
 * @class JsSdkWrapper
 */
class JsSdkWrapper {
  /**
   * Initialize SDK Obj.
   *
   * @sets oThis.tokenService, oThis.userService, oThis.deviceService, oThis.transactionsService, oThis.balanceService
   *       oThis.webhooksService
   *
   * @returns {Promise<void>}
   * @private
   */
  async _initializeSDKObj() {
    const oThis = this;

    if (!oThis.apiKey || !oThis.apiSecret) {
      await oThis._fetchApiKeyAndSecret();
    }

    const ostSdkObj = new OSTSDK({
      apiKey: oThis.apiKey,
      apiSecret: oThis.apiSecret,
      apiEndpoint: coreConstants.PA_SA_API_END_POINT
    });

    oThis.pricePointsService = ostSdkObj.services.price_points;
    oThis.tokenService = ostSdkObj.services.tokens;
    oThis.userService = ostSdkObj.services.users;
    oThis.deviceService = ostSdkObj.services.devices;
    oThis.transactionsService = ostSdkObj.services.transactions;
    oThis.balanceService = ostSdkObj.services.balance;
    oThis.webhooksService = ostSdkObj.services.webhooks;
  }

  /**
   * Verify webhook signature.
   *
   * @param {string} version
   * @param {string} stringifiedData
   * @param {string} requestTimestamp
   * @param {string} signature
   * @param {string} webhookSecret
   *
   * @return {Promise<boolean>}
   */
  async verifyWebhookSignature(version, stringifiedData, requestTimestamp, signature, webhookSecret) {
    const oThis = this;

    if (!oThis.webhooksService) {
      await oThis._initializeSDKObj();
    }

    return oThis.webhooksService.verifySignature(version, stringifiedData, requestTimestamp, signature, webhookSecret);
  }

  /**
   * Get token details.
   * OST Service: GET /Token
   *
   * @returns {Promise<*>}
   */
  async getToken() {
    const oThis = this;

    if (!oThis.tokenService) {
      await oThis._initializeSDKObj();
    }

    const tokenServiceResponse = await oThis.tokenService.get().catch(function(err) {
      return oThis._errorResponseHandler(err);
    });

    if (tokenServiceResponse && tokenServiceResponse.success) {
      return oThis._successResponseHandler(tokenServiceResponse.data);
    }

    return oThis._errorResponseHandler(tokenServiceResponse);
  }

  /**
   * Gets transaction details
   *
   * @param {object} params
   * @param {string} params.transaction_id
   * @param {string} params.user_id
   *
   * @returns {Promise<*>}
   */
  async getTransaction(params) {
    const oThis = this;

    if (!oThis.transactionsService) {
      await oThis._initializeSDKObj();
    }
    const transactionServiceResponse = await oThis.transactionsService.get(params).catch(function(err) {
      return oThis._errorResponseHandler(err);
    });

    if (transactionServiceResponse && transactionServiceResponse.success) {
      return oThis._successResponseHandler(transactionServiceResponse.data);
    }

    return oThis._errorResponseHandler(transactionServiceResponse);
  }

  /**
   * Execute transaction.
   * OST Service: POST /transactions
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  async executeTransaction(params) {
    const oThis = this;

    if (!oThis.transactionsService) {
      await oThis._initializeSDKObj();
    }

    const executeTransactionServiceResponse = await oThis.transactionsService.execute(params).catch(function(err) {
      return oThis._errorResponseHandler(err);
    });

    if (executeTransactionServiceResponse && executeTransactionServiceResponse.success) {
      return oThis._successResponseHandler(executeTransactionServiceResponse.data);
    }

    return oThis._errorResponseHandler(executeTransactionServiceResponse);
  }

  /**
   * Create user.
   * OST Service: POST /users
   *
   * @returns {Promise<*>}
   */
  async createUser() {
    const oThis = this;

    if (!oThis.userService) {
      await oThis._initializeSDKObj();
    }

    const createUserServiceResponse = await oThis.userService.create().catch(function(err) {
      return oThis._errorResponseHandler(err);
    });

    if (createUserServiceResponse && createUserServiceResponse.success) {
      return oThis._successResponseHandler(createUserServiceResponse.data);
    }

    return oThis._errorResponseHandler(createUserServiceResponse);
  }

  /**
   * Register device.
   * OST Service: POST /users/{user_id}/devices
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  async registerDevice(params) {
    const oThis = this;

    if (!oThis.deviceService) {
      await oThis._initializeSDKObj();
    }

    const registerDeviceServiceResponse = await oThis.deviceService.create(params).catch(function(err) {
      // We are skipping the error log entry here because we have handled the error log entry in register device service.
      return oThis._errorResponseHandler(err, 1);
    });

    if (registerDeviceServiceResponse && registerDeviceServiceResponse.success) {
      return oThis._successResponseHandler(registerDeviceServiceResponse.data);
    }

    return oThis._errorResponseHandler(registerDeviceServiceResponse);
  }

  /**
   * Get device details.
   * OST Service: Get /users/{user_id}/devices/{device_address}
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  async getDeviceDetails(params) {
    const oThis = this;

    if (!oThis.deviceService) {
      await oThis._initializeSDKObj();
    }

    const getDeviceDetailsServiceResponse = await oThis.deviceService.get(params).catch(function(err) {
      return oThis._errorResponseHandler(err);
    });

    if (getDeviceDetailsServiceResponse && getDeviceDetailsServiceResponse.success) {
      return oThis._successResponseHandler(getDeviceDetailsServiceResponse.data);
    }

    return oThis._errorResponseHandler(getDeviceDetailsServiceResponse);
  }

  /**
   * Get Price points
   * OST Service: GET /chains/{chain_id}/price-points
   *
   * @param {object} params
   * @param {number} params.chainId
   *
   * @returns {Promise<*>}
   */
  async pricePoints(params) {
    const oThis = this;

    if (!oThis.pricePointsService) {
      await oThis._initializeSDKObj();
    }

    const pricePointsServiceResponse = await oThis.pricePointsService
      .get({ chain_id: params.chainId })
      .catch(function(err) {
        return oThis._errorResponseHandler(err);
      });

    if (pricePointsServiceResponse && pricePointsServiceResponse.success) {
      return oThis._successResponseHandler(pricePointsServiceResponse.data);
    }

    return oThis._errorResponseHandler(pricePointsServiceResponse);
  }

  /**
   * Get user balance
   * OST Service: GET /users/{user_id}/balance
   *
   * @param {object} params
   * @param {number} params.userId
   *
   * @returns {Promise<*>}
   */
  async getUserBalance(params) {
    const oThis = this;

    if (!oThis.balanceService) {
      await oThis._initializeSDKObj();
    }

    const balanceServiceResponse = await oThis.balanceService.get({ user_id: params.userId }).catch(function(err) {
      return oThis._errorResponseHandler(err);
    });

    if (balanceServiceResponse && balanceServiceResponse.success) {
      return oThis._successResponseHandler(balanceServiceResponse.data);
    }

    return oThis._errorResponseHandler(balanceServiceResponse);
  }

  /**
   * Create webhooks.
   * OST Service: POST /webhooks
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  async createWebhooks(params) {
    const oThis = this;

    if (!oThis.webhooksService) {
      await oThis._initializeSDKObj();
    }

    const webhooksServiceResponse = await oThis.webhooksService.create(params).catch(function(err) {
      return oThis._errorResponseHandler(err);
    });

    if (webhooksServiceResponse && webhooksServiceResponse.success) {
      return oThis._successResponseHandler(webhooksServiceResponse.data);
    }

    return oThis._errorResponseHandler(webhooksServiceResponse);
  }

  /**
   * Update webhooks.
   * OST Service: POST /webhooks
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  async updateWebhooks(params) {
    const oThis = this;

    if (!oThis.webhooksService) {
      await oThis._initializeSDKObj();
    }

    const webhooksServiceResponse = await oThis.webhooksService.update(params).catch(function(err) {
      return oThis._errorResponseHandler(err);
    });

    if (webhooksServiceResponse && webhooksServiceResponse.success) {
      return oThis._successResponseHandler(webhooksServiceResponse.data);
    }

    return oThis._errorResponseHandler(webhooksServiceResponse);
  }

  /**
   * Function to fetch ost platform's api key and api secret.
   *
   * @sets oThis.apiKey, oThis.apiSecret
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchApiKeyAndSecret() {
    const oThis = this;

    const tokenData = await new SecureTokenCache().fetch();
    if (tokenData.isFailure()) {
      logger.error('Error while fetching token data');

      return Promise.reject(tokenData);
    }

    oThis.apiKey = tokenData.data.apiKey;

    const encryptedEncryptionSalt = tokenData.data.encryptionSaltLc,
      encryptionSaltD = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, encryptedEncryptionSalt);

    oThis.apiSecret = localCipher.decrypt(encryptionSaltD, tokenData.data.apiSecret);
  }

  /**
   * Error response handler for sdk result obj.
   *
   * @param error
   * @param skipErrorLog - default 0
   *
   * @returns {Promise<never>}
   * @private
   */
  async _errorResponseHandler(error, skipErrorLog) {
    logger.error(error);

    let errorObj = null;
    skipErrorLog = skipErrorLog || 0;

    if (responseHelper.isCustomResult(error)) {
      errorObj = error;
    } else {
      errorObj = responseHelper.error({
        internal_error_identifier: 'l_op_jsw_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { error: JSON.stringify(error), stack: error.stack }
      });
    }

    if (!skipErrorLog) {
      await createErrorLogsEntry.perform(errorObj, errorLogsConstants.highSeverity);
    }

    return Promise.reject(errorObj);
  }

  /**
   * Success response handler for sdk result obj.
   *
   * @param {object} successData
   *
   * @returns {*|result}
   * @private
   */
  _successResponseHandler(successData) {
    logger.info(successData);

    return responseHelper.successWithData(successData);
  }
}

module.exports = new JsSdkWrapper();
