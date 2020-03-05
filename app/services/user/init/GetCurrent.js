const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  PricePointsCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType');

class GetCurrentUser extends ServiceBase {
  /**
   * @param {Object} params
   * @param {String} params.current_user: User Name
   * @param {String} params.login_service_type: login service type
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userId = params.current_user.id;
    oThis.loginServiceType = params.login_service_type;
    oThis.pricePoints = {};
    oThis.tokenDetails = {};
    oThis.imageMap = {};
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

    await oThis._fetchImages();

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

    const cacheResp = await new SecureUserCache({ id: oThis.userId }).fetch();
    if (cacheResp.isFailure() || !cacheResp.data.id) {
      return Promise.reject(cacheResp);
    }

    oThis.secureUser = cacheResp.data;

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
   * Fetch images.
   *
   * @sets oThis.imageMap
   *
   * @return {Promise<*>}
   * @private
   */
  async _fetchImages() {
    const oThis = this;

    if (!oThis.secureUser.profileImageId) {
      return;
    }

    let imageId = oThis.secureUser.profileImageId;

    const cacheRsp = await new ImageByIdCache({ ids: [imageId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.imageMap = cacheRsp.data;
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

    const decryptedEncryptionSalt = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, oThis.secureUser.encryptionSaltLc);

    // NOTE - this cookie versioning has been introduced on 22/01/2020.
    const userLoginCookieValue = new UserModel().getCookieValueFor(oThis.secureUser, decryptedEncryptionSalt, {
      timestamp: Date.now() / 1000,
      loginServiceType: oThis.loginServiceType
    });

    const safeFormattedUserData = new UserModel().safeFormattedData(oThis.secureUser);
    const safeFormattedTokenUserData = new TokenUserModel().safeFormattedData(oThis.tokenUser);

    return responseHelper.successWithData({
      usersByIdMap: { [safeFormattedUserData.id]: safeFormattedUserData },
      tokenUsersByUserIdMap: { [safeFormattedTokenUserData.userId]: safeFormattedTokenUserData },
      user: safeFormattedUserData,
      imageMap: oThis.imageMap,
      tokenUser: safeFormattedTokenUserData,
      userLoginCookieValue: userLoginCookieValue,
      meta: { isRegistration: 1, serviceType: oThis.loginServiceType },
      pricePointsMap: oThis.pricePoints,
      tokenDetails: oThis.tokenDetails
    });
  }
}

module.exports = GetCurrentUser;
