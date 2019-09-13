const rootPrefix = '../../..',
  jsSdkWrapper = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GetBalance extends ServiceBase {
  /**
   * Constructor for get balance
   *
   * @param {String} params.user_id: user id
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.userId = params.user_id;

    oThis.ostUserId = null;
  }

  /**
   * Async Perform
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchTokenUserData();

    return oThis._requestPlatformToGetBalance();
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
   * Request platform to get balance using platform's sdk
   *
   * @returns {Promise<void>}
   * @private
   */
  async _requestPlatformToGetBalance() {
    const oThis = this;

    let paramsForPlatform = {
      userId: oThis.ostUserId
    };

    let platformResponse = await jsSdkWrapper.getUserBalance(paramsForPlatform);

    if (platformResponse.isFailure()) {
      logger.error(platformResponse);

      return Promise.reject(platformResponse);
    }

    let resultType = platformResponse.data['result_type'],
      returnData = {
        balance: platformResponse.data[resultType]
      };

    return responseHelper.successWithData(returnData);
  }
}

module.exports = GetBalance;
