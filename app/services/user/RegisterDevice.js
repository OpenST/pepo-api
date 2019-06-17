const rootPrefix = '../../..',
  jsSdkWrapper = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
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
   * @param {String} params.current_user.id: Current user id
   * @param {String} params.device_address: Device address
   * @param {String} params.api_signer_address: API signer address
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.userId = params.current_user.id;
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

    let tokenUserData = await new TokenUserDetailByUserIdsCache({ userIds: [oThis.userId] }).fetch();

    oThis.ostUserId = tokenUserData.data[oThis.userId].ostUserId;

    if (!oThis.ostUserId) {
      logger.error('Error while fetching data from token user cache');
      return Promise.reject(tokenUserData);
    }

    return responseHelper.successWithData({});
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
      if (platformResponse.debugOptions.err.code === 'ALREADY_EXISTS') {
        return responseHelper.error({
          internal_error_identifier: 'a_s_u_rd_1',
          api_error_identifier: 'duplicate_entry',
          debug_options: { err: platformResponse.debugOptions.err }
        });
      }
      logger.error('Register device API to platform failed.');
      await createErrorLogsEntry.perform(platformResponse, errorLogsConstants.highSeverity);
      return Promise.reject(platformResponse);
    }

    let resultType = platformResponse.data['result_type'],
      returnData = {
        device: platformResponse.data[resultType]
      };

    return responseHelper.successWithData(returnData);
  }
}

module.exports = RegisterDevice;
