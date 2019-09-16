const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  jsSdkWrapper = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser');

/**
 * Class to get balance for user.
 *
 * @class GetBalance
 */
class GetBalance extends ServiceBase {
  /**
   * Constructor to get balance for user.
   *
   * @param {string} params.user_id: user id
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userId = params.user_id;

    oThis.ostUserId = null;
  }

  /**
   * Async perform.
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
   * Fetch token user data.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTokenUserData() {
    const oThis = this;

    const tokenUserResponse = await new TokenUserDetailByUserIdsCache({ userIds: [oThis.userId] }).fetch();
    if (tokenUserResponse.isFailure()) {
      return Promise.reject(tokenUserResponse);
    }

    const tokenUserData = tokenUserResponse.data[oThis.userId];

    oThis.ostUserId = tokenUserData.ostUserId;

    if (!oThis.ostUserId) {
      logger.error('Error while fetching data from token user cache.');

      return Promise.reject(tokenUserData);
    }

    if (tokenUserData.ostStatus !== tokenUserConstants.activatedOstStatus) {
      logger.error('Token holder is not deployed for the user.');

      return Promise.reject(tokenUserData);
    }
  }

  /**
   * Request platform to get balance using platform's sdk.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _requestPlatformToGetBalance() {
    const oThis = this;

    const paramsForPlatform = {
      userId: oThis.ostUserId
    };

    const platformResponse = await jsSdkWrapper.getUserBalance(paramsForPlatform);
    if (platformResponse.isFailure()) {
      logger.error(platformResponse);

      return Promise.reject(platformResponse);
    }

    const resultType = platformResponse.data.result_type,
      returnData = {
        balance: platformResponse.data[resultType]
      };

    return responseHelper.successWithData(returnData);
  }
}

module.exports = GetBalance;
