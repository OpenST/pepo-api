const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  PricePointsCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  SecureTwitterUserExtendedByTwitterUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/single/SecureTwitterUserExtendedByTwitterUserId'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class GetCurrentUser extends ServiceBase {
  /**
   * @param {Object} params
   * @param {String} params.current_user: User Name
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userId = params.current_user.id;
    oThis.pricePoints = {};
    oThis.tokenDetails = {};

    oThis.twitterUserObj = null;
    oThis.twitterUserExtended = null;
  }

  /**
   * perform
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchUser();

    await oThis._fetchTokenUser();

    await oThis._fetchPricePoints();

    await oThis._setTokenDetails();

    await oThis._fetchTwitterUser();

    await oThis.fetchTwitterUserExtended();

    return Promise.resolve(oThis._serviceResponse());
  }

  /**
   * Fetch Secure user
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _fetchUser() {
    const oThis = this;
    logger.log('fetch User');

    let usersByIdHashRes = await new UserMultiCache({ ids: [oThis.userId] }).fetch();

    if (usersByIdHashRes.isFailure()) {
      return Promise.reject(usersByIdHashRes);
    }

    let usersByIdMap = usersByIdHashRes.data;
    oThis.user = usersByIdMap[oThis.userId];

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch Token user
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    logger.log('fetch Token User');

    let tokenUserRes = await new TokenUserDetailByUserIdsCache({ userIds: [oThis.userId] }).fetch();

    if (tokenUserRes.isFailure()) {
      return Promise.reject(tokenUserRes);
    }

    oThis.tokenUser = tokenUserRes.data[oThis.userId];

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch price points.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPricePoints() {
    const oThis = this;

    const pricePointsCacheRsp = await new PricePointsCache().fetch();

    if (pricePointsCacheRsp.isFailure()) {
      return Promise.reject(pricePointsCacheRsp);
    }

    oThis.pricePoints = pricePointsCacheRsp.data;
  }

  /**
   * Fetch token details.
   *
   * @return {Promise<void>}
   * @private
   */
  async _setTokenDetails() {
    const oThis = this;

    let getTokenServiceObj = new GetTokenService({});

    let tokenResp = await getTokenServiceObj.perform();

    if (tokenResp.isFailure()) {
      return Promise.reject(tokenResp);
    }
    oThis.tokenDetails = tokenResp.data.tokenDetails;
  }

  /**
   * Fetch Twitter User Obj if present.
   *
   * @sets oThis.twitterUserObj
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchTwitterUser() {
    const oThis = this;

    logger.log('Start::Fetch Twitter User');

    const twitterUserCacheRsp = await new TwitterUserByUserIdsCache({
      userIds: [oThis.userId]
    }).fetch();

    if (twitterUserCacheRsp.isFailure()) {
      return Promise.reject(twitterUserCacheRsp);
    }

    oThis.twitterUserObj = twitterUserCacheRsp.data[oThis.userId];

    logger.log('End::Fetch Twitter User');
    return responseHelper.successWithData({});
  }

  /**
   * Fetch Twitter user Extended
   *
   * @sets oThis.twitterUserExtended
   *
   * @return {Promise<Result>}
   * @private
   */
  async fetchTwitterUserExtended() {
    const oThis = this;

    const secureTwitterUserExtendedRes = await new SecureTwitterUserExtendedByTwitterUserIdCache({
      twitterUserId: oThis.twitterUserObj.id
    }).fetch();

    if (secureTwitterUserExtendedRes.isFailure()) {
      return Promise.reject(secureTwitterUserExtendedRes);
    }

    oThis.twitterUserExtended = secureTwitterUserExtendedRes.data;
  }

  /**
   * Response for service
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _serviceResponse() {
    const oThis = this;

    const safeFormattedUserData = new UserModel().safeFormattedData(oThis.user);
    const safeFormattedTokenUserData = new TokenUserModel().safeFormattedData(oThis.tokenUser);
    const safeFormattedTwitterUserExtendedData = new TwitterUserExtendedModel().safeFormattedData(
      oThis.twitterUserExtended
    );

    return responseHelper.successWithData({
      usersByIdMap: { [safeFormattedUserData.id]: safeFormattedUserData },
      tokenUsersByUserIdMap: { [safeFormattedTokenUserData.userId]: safeFormattedTokenUserData },
      user: safeFormattedUserData,
      tokenUser: safeFormattedTokenUserData,
      pricePointsMap: oThis.pricePoints,
      tokenDetails: oThis.tokenDetails,
      twitterUserExtended: safeFormattedTwitterUserExtendedData
    });
  }
}

module.exports = GetCurrentUser;
