const OSTSDK = require('@ostdotcom/ost-sdk-js');

const rootPrefix = '../..',
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher');

/**
 * Class for ost-sdk-js wrapper
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

    const tokenServiceResponse = await oThis.tokenService.get();

    if (tokenServiceResponse && tokenServiceResponse.success) {
      return oThis._successResponseHandler(tokenServiceResponse.data);
    }

    return oThis._errorResponseHandler(tokenServiceResponse);
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

    if (!oThis.tokenService) {
      await oThis._initializeSDKObj();
    }

    const executeTransactionServiceResponse = await oThis.transactionsService.execute(params);

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

    const createUserServiceResponse = await oThis.userService.create();

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

    const registerDeviceServiceResponse = await oThis.deviceService.create(params);

    if (registerDeviceServiceResponse && registerDeviceServiceResponse.success) {
      return oThis._successResponseHandler(registerDeviceServiceResponse.data);
    }

    return oThis._errorResponseHandler(registerDeviceServiceResponse);
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

    const webhooksServiceResponse = await oThis.webhooksService.create(params);

    if (webhooksServiceResponse && webhooksServiceResponse.success) {
      return oThis._successResponseHandler(webhooksServiceResponse.data);
    }

    return oThis._errorResponseHandler(webhooksServiceResponse);
  }

  /**
   * Gets transaction details
   *
   * @param params {Object}
   * @param params {String} params.transaction_uuid
   * @param params {String} params.user_id
   *
   * @returns {Promise<*>}
   */
  async getTransaction(params) {
    const oThis = this;

    if (!oThis.transactionsService) {
      await oThis._initializeSDKObj();
    }
    let transactionServiceResponse = await oThis.transactionsService.get(params);

    if (transactionServiceResponse && transactionServiceResponse.success) {
      return oThis._successResponseHandler(transactionServiceResponse.data);
    } else {
      return oThis._errorResponseHandler(transactionServiceResponse);
    }
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

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_op_jsw_2',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    oThis.apiKey = tokenData.data.apiKey;

    const encryptedEncryptionSalt = tokenData.data.encryptionSaltLc,
      encryptionSaltD = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, encryptedEncryptionSalt);

    oThis.apiSecret = localCipher.decrypt(encryptionSaltD, tokenData.data.apiSecret);
  }

  /**
   * Error response handler for sdk result obj.
   *
   * @param {object} error
   *
   * @returns {*}
   * @private
   */
  _errorResponseHandler(error) {
    logger.error(error);

    return responseHelper.error({
      internal_error_identifier: 'l_op_jsw_1',
      api_error_identifier: 'something_went_wrong',
      debug_options: { err: error }
    });
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
