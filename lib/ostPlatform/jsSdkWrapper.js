const OSTSDK = require('@ostdotcom/ost-sdk-js');

const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  SecureTokenData = require(rootPrefix + '/lib/cacheManagement/SecureTokenData');

/**
 * Class for ost-sdk-js wrapper
 *
 * @class
 */
class JsSdkWrapper {
  /**
   * Constructor for ost-sdk-js wrapper
   *
   * @constructor
   */
  constructor() {}

  /**
   * Initialize SDK Obj
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
   * token details
   * GET /Token
   *
   * @returns {Promise<*>}
   */
  async getToken() {
    const oThis = this;

    if (!oThis.tokenService) {
      await oThis._initializeSDKObj();
    }

    let tokenServiceResponse = await oThis.tokenService.get();

    if (tokenServiceResponse && tokenServiceResponse.success) {
      return oThis._successResponseHandler(tokenServiceResponse.data);
    } else {
      return oThis._errorResponseHandler(tokenServiceResponse);
    }
  }

  /**
   * create user
   * POST /users
   *
   * @returns {Promise<*>}
   */
  async executeTransaction(params) {
    const oThis = this;

    if (!oThis.tokenService) {
      await oThis._initializeSDKObj();
    }

    let executeTransactionServiceResponse = await oThis.transactionsService.execute(params);

    if (executeTransactionServiceResponse && executeTransactionServiceResponse.success) {
      return oThis._successResponseHandler(executeTransactionServiceResponse.data);
    } else {
      return oThis._errorResponseHandler(executeTransactionServiceResponse);
    }
  }

  /**
   * create user
   * POST /users
   *
   * @returns {Promise<*>}
   */
  async createUser() {
    const oThis = this;

    if (!oThis.userService) {
      await oThis._initializeSDKObj();
    }

    let createUserServiceResponse = await oThis.userService.create();

    if (createUserServiceResponse && createUserServiceResponse.success) {
      return oThis._successResponseHandler(createUserServiceResponse.data);
    } else {
      return oThis._errorResponseHandler(createUserServiceResponse);
    }
  }

  /**
   * register device
   * POST /users/{user_id}/devices
   *
   * @param params
   * @returns {Promise<*>}
   */
  async registerDevice(params) {
    const oThis = this;

    if (!oThis.deviceService) {
      await oThis._initializeSDKObj();
    }

    let registerDeviceServiceResponse = await oThis.deviceService.create(params);

    if (registerDeviceServiceResponse && registerDeviceServiceResponse.success) {
      return oThis._successResponseHandler(registerDeviceServiceResponse.data);
    } else {
      return oThis._errorResponseHandler(registerDeviceServiceResponse);
    }
  }

  /**
   * Create Web hooks
   *
   *
   * @param params
   * @returns {Promise<*>}
   */
  async createWebhooks(params) {
    const oThis = this;

    if (!oThis.webhooksService) {
      await oThis._initializeSDKObj();
    }

    let webhooksServiceResponse = await oThis.webhooksService.create(params);

    if (webhooksServiceResponse && webhooksServiceResponse.success) {
      return oThis._successResponseHandler(webhooksServiceResponse.data);
    } else {
      return oThis._errorResponseHandler(webhooksServiceResponse);
    }
  }

  /**
   * Function to fetch ost platform's api key and api secret
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchApiKeyAndSecret() {
    const oThis = this;

    let tokenData = await new SecureTokenData().fetch();
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

    let encryptedEncryptionSalt = tokenData.data.encryptionSaltLc,
      encryptionSaltD = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, encryptedEncryptionSalt);

    oThis.apiSecret = localCipher.decrypt(encryptionSaltD, tokenData.data.apiSecret);
  }

  /**
   * Error response handler for sdk result obj
   *
   * @param error
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
   * Success response handler for sdk result obj
   *
   * @param successData
   * @returns {*|result}
   * @private
   */
  _successResponseHandler(successData) {
    logger.info(successData);
    return responseHelper.successWithData(successData);
  }
}

module.exports = new JsSdkWrapper();
