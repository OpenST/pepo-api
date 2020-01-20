const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  PricePointsCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
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

    return responseHelper.successWithData({
      usersByIdMap: { [safeFormattedUserData.id]: safeFormattedUserData },
      tokenUsersByUserIdMap: { [safeFormattedTokenUserData.userId]: safeFormattedTokenUserData },
      user: safeFormattedUserData,
      tokenUser: safeFormattedTokenUserData,
      pricePointsMap: oThis.pricePoints,
      tokenDetails: oThis.tokenDetails
    });
  }
}

module.exports = GetCurrentUser;
