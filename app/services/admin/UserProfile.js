const BigNumber = require('bignumber.js');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetProfile = require(rootPrefix + '/lib/user/profile/Get'),
  GetPepocornBalance = require(rootPrefix + '/lib/pepocorn/GetPepocornBalance'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  UserMuteByUser2IdsForGlobalCache = require(rootPrefix + '/lib/cacheManagement/multi/UserMuteByUser2IdsForGlobal'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  jsSdkWrapper = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser');

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
   * @param {number/string} params.profile_user_id
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
    oThis.globalUserMuteDetailsByUserIdMap = {};
    oThis.profileResponse = {};
    oThis.stakeCurrency = null;
    oThis.pepocornBalance = null;
    oThis.pricePoints = {};
    oThis.balance = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    const promisesArray = [
      oThis._getProfileInfo(),
      oThis._fetchTokenUserData(),
      oThis._fetchTokenDetails(),
      oThis._fetchMuteDetails(),
      oThis._fetchPepocornBalance()
    ];
    await Promise.all(promisesArray);

    await oThis._fetchBalance();

    return oThis._prepareResponse();
  }

  /**
   * Fetch profile info.
   *
   * @sets oThis.profileResponse, oThis.pricePoints
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
   * Fetch token user data.
   *
   * @sets oThis.ostUserId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTokenUserData() {
    const oThis = this;

    const tokenUserCacheResponse = await new TokenUserDetailByUserIdsCache({ userIds: [oThis.profileUserId] }).fetch();
    if (tokenUserCacheResponse.isFailure()) {
      return Promise.reject(tokenUserCacheResponse);
    }

    const tokenUserData = tokenUserCacheResponse.data[oThis.profileUserId];

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
   * Fetch mute user details.
   *
   * @sets oThis.stakeCurrency
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchMuteDetails() {
    const oThis = this;

    const cacheResponse = await new UserMuteByUser2IdsForGlobalCache({ user2Ids: [oThis.profileUserId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.globalUserMuteDetailsByUserIdMap = cacheResponse.data;
  }

  /**
   * Fetch token details.
   *
   * @sets oThis.stakeCurrency
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTokenDetails() {
    const oThis = this;

    const tokenDetailsCacheResponse = await new SecureTokenCache({}).fetch();
    if (tokenDetailsCacheResponse.isFailure()) {
      return Promise.reject(tokenDetailsCacheResponse);
    }

    const tokenDetails = tokenDetailsCacheResponse.data;

    oThis.stakeCurrency = tokenDetails.stakeCurrency;
  }

  /**
   * Fetch pepocorn balance for user.
   *
   * @sets oThis.pepocornBalance
   *
   * @returns {Promise<void>}
   *
   * @private
   */
  async _fetchPepocornBalance() {
    const oThis = this;

    const pepoCornBalanceObject = await new GetPepocornBalance({ userIds: [oThis.profileUserId] }).perform();

    oThis.pepocornBalance = pepoCornBalanceObject[oThis.profileUserId].balance;
  }

  /**
   * Fetch balance.
   *
   * @sets oThis.balance
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
    const balance = new BigNumber(platformResponse.data[resultType].available_balance);
    const pricePoint = oThis.pricePoints[oThis.stakeCurrency].USD;
    const usdPricePointInBigNumber = new BigNumber(pricePoint);

    oThis.balance = {
      balanceInUsd: balance.mul(usdPricePointInBigNumber).toString(10),
      balanceInPepo: balance.toString(10),
      pepocornBalance: oThis.pepocornBalance
    };
  }

  /**
   * Prepare response.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      usersByIdMap: oThis.profileResponse.usersByIdMap,
      globalUserMuteDetailsMap: oThis.globalUserMuteDetailsByUserIdMap,
      userProfile: oThis.profileResponse.userProfilesMap[oThis.profileUserId],
      imageMap: oThis.profileResponse.imageMap,
      tokenUsersByUserIdMap: oThis.profileResponse.tokenUsersByUserIdMap,
      userBalance: oThis.balance
    });
  }
}

module.exports = UserProfile;
