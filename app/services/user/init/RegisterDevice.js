const rootPrefix = '../../../..',
  jsSdkWrapper = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  ReplayAttackCache = require(rootPrefix + '/lib/cacheManagement/single/ReplayAttackOnRegisterDevice'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

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

    oThis.isDuplicateRequest = false;
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

    await oThis._validateDuplicateRequest();

    if (oThis.isDuplicateRequest) {
      return oThis._requestPlatformToGetUserDeviceDetail();
    }

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
   * Validate duplicate request
   *
   * @return {Promise<Result>}
   * @private
   */
  async _validateDuplicateRequest() {
    const oThis = this;
    logger.log('Start::_validateDuplicateRequest');

    const ReplayAttackOnRegisterDeviceCacheResp = await new ReplayAttackCache({ userId: oThis.userId }).fetch();

    if (ReplayAttackOnRegisterDeviceCacheResp.isFailure()) {
      oThis.isDuplicateRequest = true;
    }

    logger.log('End::_validateDuplicateRequest');
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

    if (tokenUserData.isFailure()) {
      return Promise.reject(tokenUserData);
    }

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
          internal_error_identifier: 'a_s_u_rd_2',
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

  /**
   * Request platform to get user device details using platform's sdk
   *
   * @returns {Promise<void>}
   * @private
   */
  async _requestPlatformToGetUserDeviceDetail() {
    const oThis = this;

    let paramsForPlatform = {
      user_id: oThis.ostUserId,
      device_address: oThis.deviceAddress
    };

    let platformResponse = await jsSdkWrapper.getDeviceDetails(paramsForPlatform);

    if (platformResponse.isFailure()) {
      logger.error('Get device details API to platform failed.');
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
