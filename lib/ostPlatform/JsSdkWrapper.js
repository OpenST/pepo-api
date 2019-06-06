const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  OSTSDK = require('@ostdotcom/ost-sdk-js');

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
  constructor() {
    const oThis = this;

    oThis._initializeSDKObj();
  }

  /**
   * Initialize SDK Obj
   * @private
   */
  _initializeSDKObj() {
    const oThis = this;

    const ostSdkObj = new OSTSDK({
      apiKey: coreConstants.PA_SA_API_KEY,
      apiSecret: coreConstants.PA_SA_API_SECRET,
      apiEndpoint: coreConstants.PA_SA_API_END_POINT
    });

    oThis.tokenService = ostSdkObj.services.tokens;
    oThis.userService = ostSdkObj.services.users;
    oThis.deviceService = ostSdkObj.services.devices;
    oThis.transactionsService = ostSdkObj.services.transactions;
    oThis.balanceService = ostSdkObj.services.balance;
  }

  /**
   * token details
   * GET /Token
   *
   * @returns {Promise<*>}
   */
  async getToken() {
    const oThis = this;

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
  async createUser() {
    const oThis = this;

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

    let registerDeviceServiceResponse = await oThis.deviceService.create(params);

    if (registerDeviceServiceResponse && registerDeviceServiceResponse.success) {
      return oThis._successResponseHandler(registerDeviceServiceResponse.data);
    } else {
      return oThis._errorResponseHandler(registerDeviceServiceResponse);
    }
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
