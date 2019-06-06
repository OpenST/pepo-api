/**
 * Util class to handle bit wise operations
 *
 * @module app/services/userManagement/RegisterDevice
 */

const rootPrefix = '../../..',
  jsSdkWrapper = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  ErrorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  TokenUserByUserIdCache = require(rootPrefix + '/lib/cacheManagement/TokenUserByUserId'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Register Device
 *
 * @class
 */
class RegisterDevice extends ServiceBase {
  /**
   * Constructor for cache management base
   *
   * @param {String} params.currentUser.id: Current user id
   * @param {String} params.device_address: Device address
   * @param {String} params.api_signer_address: API signer address
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.userId = params.currentUser.id;
    oThis.deviceAddress = params.device_address;
    oThis.apiSignerAddress = params.api_signer_address;
  }

  /**
   * Async Perform
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    oThis._sanitizeParams();

    await oThis._fetchTokenUserData();

    return oThis._requestPlatformToRegisterDevice();
  }

  /**
   * sanitize params.
   * Note: Validation is already done in authentication layer.
   *
   * @private
   */
  _sanitizeParams() {
    const oThis = this;

    oThis.deviceAddress = oThis.deviceAddress.toLowerCase();
    oThis.apiSignerAddress = oThis.apiSignerAddress.toLowerCase();

    oThis.ostUserId = null;
  }

  /**
   * Function to fetch token user data.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTokenUserData() {
    const oThis = this;

    let tokenUserData = await new TokenUserByUserIdCache({ userId: oThis.userId }).fetch();

    if (tokenUserData.isFailure()) {
      logger.error('Error while fetching data from token user cache');
      return Promise.reject(tokenUserData);
    }

    if (!tokenUserData.data.ostUserId) {
      logger.error('Invalid userdata in token user table');
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_um_rd_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: tokenUserData.data
        })
      );
    }

    oThis.ostUserId = tokenUserData.data.ostUserId;
  }

  /**
   * Request platform to register device using platform's sdk
   *
   * @returns {Promise<void>}
   * @private
   */
  async _requestPlatformToRegisterDevice() {
    const oThis = this;

    let paramsForPlatform = {
      user_id: oThis.ostUserId,
      address: oThis.deviceAddress,
      api_signer_address: oThis.apiSignerAddress
    };

    let platformResponse = await jsSdkWrapper.registerDevice(paramsForPlatform);

    if (platformResponse.isFailure()) {
      logger.error('Register device API to platform failed.');
      await createErrorLogsEntry.perform(platformResponse, ErrorLogsConstants.highSeverity);
      return Promise.reject(platformResponse);
    }

    let resultType = platformResponse.data['result_type'];

    return platformResponse.data[resultType];
  }
}

module.exports = RegisterDevice;
