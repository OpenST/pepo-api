const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  PricePointsCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  tokenConstants = require(rootPrefix + '/lib/globalConstant/token'),
  ostPricePointsConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints');

/**
 * Class to fetch current user.
 *
 * @class GetCurrentUser
 */
class GetCurrentUser extends ServiceBase {
  /**
   * Constructor to fetch current user.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number} params.current_user.id
   * @param {string} params.login_service_type: login service type
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userId = params.current_user.id;
    oThis.loginServiceType = params.login_service_type;

    oThis.secureUser = {};
    oThis.tokenUser = {};
    oThis.pricePoints = {};
    oThis.tokenDetails = {};
    oThis.imageMap = {};
    oThis.airdropDetails = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await Promise.all([
      oThis._fetchUser(),
      oThis._fetchTokenUser(),
      oThis._fetchPricePoints(),
      oThis._setTokenDetails()
    ]);

    await oThis._fetchImages();

    oThis._setAirdropAmount();

    return oThis._serviceResponse();
  }

  /**
   * Fetch secure user.
   *
   * @sets oThis.secureUser
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUser() {
    const oThis = this;

    const cacheResp = await new SecureUserCache({ id: oThis.userId }).fetch();
    if (cacheResp.isFailure() || !cacheResp.data.id) {
      return Promise.reject(cacheResp);
    }

    oThis.secureUser = cacheResp.data;
  }

  /**
   * Fetch token user.
   *
   * @sets oThis.tokenUser
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    const tokenUserRes = await new TokenUserDetailByUserIdsCache({ userIds: [oThis.userId] }).fetch();
    if (tokenUserRes.isFailure()) {
      return Promise.reject(tokenUserRes);
    }

    oThis.tokenUser = tokenUserRes.data[oThis.userId];
  }

  /**
   * Fetch price points.
   *
   * @sets oThis.pricePoints
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
   * @sets oThis.tokenDetails
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setTokenDetails() {
    const oThis = this;

    const tokenResp = await new GetTokenService({}).perform();
    if (tokenResp.isFailure()) {
      return Promise.reject(tokenResp);
    }

    oThis.tokenDetails = tokenResp.data.tokenDetails;
  }

  /**
   * Fetch images.
   *
   * @sets oThis.imageMap
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchImages() {
    const oThis = this;

    const imageId = oThis.secureUser.profileImageId;

    if (!imageId) {
      return;
    }

    const cacheRsp = await new ImageByIdCache({ ids: [imageId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.imageMap = cacheRsp.data;
  }

  /**
   * Set airdrop amount.
   *
   * @sets oThis.airdropDetails
   *
   * @private
   */
  _setAirdropAmount() {
    const oThis = this;

    const usdInOneOst =
      oThis.pricePoints[ostPricePointsConstants.stakeCurrency][ostPricePointsConstants.usdQuoteCurrency];

    oThis.airdropDetails = {
      pepoAmountInWei: tokenConstants.getPepoAirdropAmountInWei(usdInOneOst),
      pepoAmountInUsd: tokenConstants.airdropAmountInUsd
    };
  }

  /**
   * Prepare service response.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _serviceResponse() {
    const oThis = this;

    const safeFormattedUserData = new UserModel().safeFormattedData(oThis.secureUser);
    const safeFormattedTokenUserData = new TokenUserModel().safeFormattedData(oThis.tokenUser);

    return responseHelper.successWithData({
      usersByIdMap: { [safeFormattedUserData.id]: safeFormattedUserData },
      tokenUsersByUserIdMap: { [safeFormattedTokenUserData.userId]: safeFormattedTokenUserData },
      user: safeFormattedUserData,
      imageMap: oThis.imageMap,
      tokenUser: safeFormattedTokenUserData,
      meta: { isRegistration: 1, serviceType: oThis.loginServiceType },
      pricePointsMap: oThis.pricePoints,
      tokenDetails: oThis.tokenDetails,
      airdropDetails: oThis.airdropDetails
    });
  }
}

module.exports = GetCurrentUser;
