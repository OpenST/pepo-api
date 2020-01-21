const rootPrefix = '../../..',
  LoginConnectBase = require(rootPrefix + '/lib/connect/login/Base'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  SecureTwitterUserExtendedByTwitterUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/single/SecureTwitterUserExtendedByTwitterUserId'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  socialConnectServiceTypeConstants = require(rootPrefix + '/lib/globalConstant/socialConnectServiceType'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
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

    oThis.userId = params.userId;
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
  async _createUpdateSocialUserExtended() {
    const oThis = this;

    logger.log('Start::Update Twitter User Extended for login', oThis.twitterUserObj);

    const SecureTwitterUserExtendedRes = await new SecureTwitterUserExtendedByTwitterUserIdCache({
      twitterUserId: oThis.twitterUserObj.id
    }).fetch();

    if (SecureTwitterUserExtendedRes.isFailure()) {
      return Promise.reject(SecureTwitterUserExtendedRes);
    }

    oThis.twitterUserExtendedObj = SecureTwitterUserExtendedRes.data;

    // If twitterUserExtendedObj is not present and user is trying to login.
    if (!CommonValidators.validateNonEmptyObject(oThis.twitterUserExtendedObj) && !oThis.isNewSocialConnect) {
      // If isNewSocialConnect means user is already present but twitter is connected first time.
      // If isNewSocialConnect is false and twitterUserExtendedObj is empty means its an error
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_c_l_bt_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }

    let accessType = twitterUserExtendedConstants.getAccessLevelFromTwitterHeader(oThis.twitterRespHeaders);

    if (CommonValidators.validateNonEmptyObject(oThis.twitterUserExtendedObj)) {
      await new TwitterUserExtendedModel()
        .update({
          token: oThis.token,
          secret: oThis._getLCEncryptedToken(oThis.secret),
          access_type: twitterUserExtendedConstants.invertedAccessTypes[accessType],
          status: twitterUserExtendedConstants.invertedStatuses[twitterUserExtendedConstants.activeStatus]
        })
        .where({ id: oThis.twitterUserExtendedObj.id })
        .fire();
    } else {
      let insertData = {
        twitter_user_id: oThis.twitterUserObj.id,
        user_id: oThis.userId,
        token: oThis.token,
        secret: oThis._getLCEncryptedToken(oThis.secret),
        access_type: twitterUserExtendedConstants.invertedAccessTypes[accessType],
        status: twitterUserExtendedConstants.invertedStatuses[twitterUserExtendedConstants.activeStatus]
      };

      // Insert user in database.
      const insertResponse = await new TwitterUserExtendedModel().insert(insertData).fire();

      oThis.twitterUserExtendedObj = new TwitterUserExtendedModel().formatDbData(insertData);
    }

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

    let insertData = {
        twitter_id: oThis.userTwitterEntity.idStr,
        user_id: oThis.userId,
        name: oThis.userTwitterEntity.formattedName,
        email: oThis._getUserSocialEmail(),
        handle: oThis.userTwitterEntity.handle,
        profile_image_url: oThis.userTwitterEntity.nonDefaultProfileImageShortUrl
      },
      insertResponse = await new TwitterUserModel().insert(insertData).fire();

    insertData.id = insertResponse.insertId;
    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    oThis.twitterUserObj = new TwitterUserModel().formatDbData(insertData);
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

  /**
   * Properties to set for user.
   *
   * @returns {number}
   * @private
   */
  _userLoginPropertiesToSet() {
    return userConstants.hasTwitterLoginProperty;
  }

  /**
   * Get service type.
   *
   * @returns {string}
   * @private
   */
  _getServiceType() {
    return socialConnectServiceTypeConstants.twitterSocialConnect;
  }
}

module.exports = TwitterLogin;
