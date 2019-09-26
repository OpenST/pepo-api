const BigNumber = require('bignumber.js');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GetProfile = require(rootPrefix + '/lib/user/profile/Get'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  jsSdkWrapper = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class to get user profile
 *
 * @class UserProfile
 */
class UserProfile extends ServiceBase {
  /**
   * Constructor to get current admin.
   *
   * @param {object} params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.profileUserId = params.profile_user_id;

    oThis.ostUserId = null;
    oThis.profileResponse = {};
    oThis.stakeCurrency = null;
    oThis.pricePoints = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._getProfileInfo();

    await oThis._fetchTokenUserData();

    await oThis._fetchTokenDetails();

    await oThis._fetchBalance();

    return oThis._prepareResponse();
  }

  /**
   * Fetch profile info
   *
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getProfileInfo() {
    const oThis = this;

    const getProfileObj = new GetProfile({
      userIds: [oThis.profileUserId],
      videoIds: [],
      isAdmin: true
    });

    const response = await getProfileObj.perform();
    if (response.isFailure()) {
      return Promise.reject(response);
    }

    oThis.profileResponse = response.data;

    oThis.pricePoints = oThis.profileResponse.pricePointsMap;
  }

  /**
   * Fetch token user data
   *
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTokenUserData() {
    const oThis = this;

    const tokenUserResponse = await new TokenUserDetailByUserIdsCache({ userIds: [oThis.profileUserId] }).fetch();
    if (tokenUserResponse.isFailure()) {
      return Promise.reject(tokenUserResponse);
    }

    const tokenUserData = tokenUserResponse.data[oThis.profileUserId];

    oThis.ostUserId = tokenUserData.ostUserId;

    if (!oThis.ostUserId) {
      logger.error('Error while fetching data from token user cache.');

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_a_up_ftud_1',
          api_error_identifier: 'could_not_proceed',
          debug_options: { tokenUserData: tokenUserData }
        })
      );
    }

    if (tokenUserData.ostStatus !== tokenUserConstants.activatedOstStatus) {
      logger.error('Token holder is not deployed for the user.');

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_a_up_ftud_2',
          api_error_identifier: 'could_not_proceed',
          debug_options: { tokenUserData: tokenUserData }
        })
      );
    }
  }

  /**
   * Fetch token details
   *
   * @sets oThis.stakeCurrency
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTokenDetails() {
    const oThis = this;

    let tokenDetailsResponse = await new SecureTokenCache({}).fetch();

    if (tokenDetailsResponse.isFailure()) {
      return Promise.reject(tokenDetailsResponse);
    }

    let tokenDetails = tokenDetailsResponse.data;

    oThis.stakeCurrency = tokenDetails.stakeCurrency;
  }

  /**
   * Fetch balance
   *
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchBalance() {
    const oThis = this;

    const paramsForPlatform = {
      userId: oThis.ostUserId
    };

    const platformResponse = await jsSdkWrapper.getUserBalance(paramsForPlatform);

    if (platformResponse.isFailure()) {
      logger.error(platformResponse);

      return Promise.reject(platformResponse);
    }

    const resultType = platformResponse.data.result_type;

    let balance = new BigNumber(platformResponse.data[resultType].available_balance);

    let pricePoint = oThis.pricePoints[oThis.stakeCurrency].USD;

    const usdPricePointInBigNumber = new BigNumber(pricePoint);
    oThis.balanceInUsd = balance.mul(usdPricePointInBigNumber).toString(10);
  }

  /**
   * Prepare response
   * @returns {Promise<void>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      usersByIdMap: oThis.profileResponse.usersByIdMap,
      userProfile: oThis.profileResponse.userProfilesMap[oThis.profileUserId],
      imageMap: oThis.profileResponse.imageMap,
      tokenUsersByUserIdMap: oThis.profileResponse.tokenUsersByUserIdMap,
      balance: oThis.balanceInUsd
    });
  }
}

module.exports = UserProfile;
