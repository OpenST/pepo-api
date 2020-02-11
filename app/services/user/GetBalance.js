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

    oThis.tokenUserData = null;
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
   * @sets oThis.tokenUserData
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

    oThis.tokenUserData = tokenUserResponse.data[oThis.userId];
  }

  /**
   * Request platform to get balance using platform's sdk.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _requestPlatformToGetBalance() {
    const oThis = this;

    let balance = {
      user_id: '',
      total_balance: '0',
      available_balance: '0',
      unsettled_debit: '0',
      updated_timestamp: Math.floor(new Date().getTime() / 1000)
    };

    if (
      !oThis.tokenUserData ||
      !oThis.tokenUserData.ostUserId ||
      oThis.tokenUserData.ostStatus !== tokenUserConstants.activatedOstStatus
    ) {
      logger.error('USER TOKEN NOT SETUP');
    } else {
      const paramsForPlatform = {
        userId: oThis.tokenUserData.ostUserId
      };

      const platformResponse = await jsSdkWrapper.getUserBalance(paramsForPlatform);
      if (platformResponse.isFailure()) {
        logger.error(platformResponse);

        return Promise.reject(platformResponse);
      }

      const resultType = platformResponse.data.result_type;
      balance = platformResponse.data[resultType];
    }

    return responseHelper.successWithData({ balance: balance });
  }
}

module.exports = GetBalance;
