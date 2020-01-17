const rootPrefix = '../../..',
  LoginConnectBase = require(rootPrefix + '/lib/connect/login/Base'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  SecureTwitterUserExtendedByTwitterUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/single/SecureTwitterUserExtendedByTwitterUserId'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for Twitter Login service.
 *
 * @class TwitterLogin
 */
class TwitterLogin extends LoginConnectBase {
  /**
   * Constructor for Twitter Login service.
   *
   * @param {object} params
   * @param {object} params.twitterUserObj: Twitter User Table Obj
   * @param {string} params.userTwitterEntity: User Entity Of Twitter
   * @param {string} params.token: Oauth User Token
   * @param {string} params.secret: Oauth User secret
   * @param {Object} params.twitterRespHeaders: Headers sent by twitter
   *
   * @augments LoginConnectBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.twitterUserObj = params.twitterUserObj;
    oThis.userTwitterEntity = params.userTwitterEntity;
    oThis.token = params.token;
    oThis.secret = params.secret;
    oThis.twitterRespHeaders = params.twitterRespHeaders;

    oThis.userId = oThis.twitterUserObj.userId;
    oThis.twitterUserExtendedObj = null;
  }

  /**
   * Update Twitter User Extended object twitter credentials and status.
   *
   * @sets oThis.twitterUserExtendedObj
   *
   * @return {Promise<Result>}
   * @private
   */
  async _updateSocialUserExtended() {
    const oThis = this;

    logger.log('Start::Update Twitter User Extended for login', oThis.twitterUserObj);

    const SecureTwitterUserExtendedRes = await new SecureTwitterUserExtendedByTwitterUserIdCache({
      twitterUserId: oThis.twitterUserObj.id
    }).fetch();

    if (SecureTwitterUserExtendedRes.isFailure()) {
      return Promise.reject(SecureTwitterUserExtendedRes);
    }

    oThis.twitterUserExtendedObj = SecureTwitterUserExtendedRes.data;

    let accessType = twitterUserExtendedConstants.getAccessLevelFromTwitterHeader(oThis.twitterRespHeaders);

    await new TwitterUserExtendedModel()
      .update({
        token: oThis.token,
        secret: oThis._getLCEncryptedToken(oThis.secret),
        access_type: twitterUserExtendedConstants.invertedAccessTypes[accessType],
        status: twitterUserExtendedConstants.invertedStatuses[twitterUserExtendedConstants.activeStatus]
      })
      .where({ id: oThis.twitterUserExtendedObj.id })
      .fire();

    await TwitterUserExtendedModel.flushCache({
      id: oThis.twitterUserExtendedObj.id,
      twitterUserId: oThis.twitterUserObj.id
    });

    oThis.twitterUserExtendedObj.accessType = accessType;
    oThis.twitterUserExtendedObj.status = twitterUserExtendedConstants.activeStatus;

    logger.log('End::Update Twitter User Extended for login');

    return responseHelper.successWithData({});
  }

  /**
   * Fetch social user extended.
   *
   * @returns {Promise<Array>}
   * @private
   */
  async _fetchSocialUserExtended() {
    const oThis = this;

    return new TwitterUserExtendedModel().safeFormattedData(oThis.twitterUserExtendedObj);
  }

  /**
   * Insert into twitter users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertIntoSocialUsers() {
    const oThis = this;

    await new TwitterUserModel()
      .insert({
        twitter_id: oThis.userTwitterEntity.idStr,
        user_id: oThis.userId,
        name: oThis.userTwitterEntity.formattedName,
        email: oThis._getUserSocialEmail(),
        handle: oThis.userTwitterEntity.handle,
        profile_image_url: oThis.userTwitterEntity.nonDefaultProfileImageShortUrl
      })
      .fire();
  }

  /**
   *  Get Social email of user from social entity
   *
   * @private
   */
  _getUserSocialEmail() {
    const oThis = this;

    let twitterEmail = oThis.userTwitterEntity.email;

    // email info is not mandatory to come from twitter.
    if (!oThis.userTwitterEntity.email || !CommonValidators.isValidEmail(oThis.userTwitterEntity.email)) {
      twitterEmail = null;
    }

    return twitterEmail;
  }

  /**
   * Update twitter users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateSocialUsers() {
    const oThis = this;

    await new TwitterUserModel()
      .update({
        user_id: oThis.userId,
        handle: oThis.userTwitterEntity.handle
      })
      .where({ id: oThis.twitterUserObj.id })
      .fire();
  }

  /**
   * Update handle in twitter users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _syncDataInSocialUsers() {
    const oThis = this;

    if (
      oThis.twitterUserObj.handle &&
      oThis.twitterUserObj.handle.toLowerCase() === oThis.userTwitterEntity.handle.toLowerCase()
    ) {
      return responseHelper.successWithData({});
    }

    let twitterUserObj = new TwitterUserModel();

    await twitterUserObj
      .update({
        handle: oThis.userTwitterEntity.handle
      })
      .where({
        twitter_id: oThis.twitterUserObj.twitterId
      })
      .fire();

    return TwitterUserModel.flushCache(oThis.twitterUserObj);
  }
}

module.exports = TwitterLogin;
