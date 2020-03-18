const rootPrefix = '../../..',
  ConnectBase = require(rootPrefix + '/app/services/connect/Base'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  TwitterUserByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByTwitterIds'),
  AccountTwitterRequestClass = require(rootPrefix + '/lib/connect/wrappers/twitter/oAuth1.0/Account'),
  SignupTwitterClass = require(rootPrefix + '/lib/connect/signup/ByTwitter'),
  LoginTwitterClass = require(rootPrefix + '/lib/connect/login/ByTwitter'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  userIdentifierConstants = require(rootPrefix + '/lib/globalConstant/userIdentifier'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common');

/**
 * Class for Twitter Connect service.
 *
 * @class TwitterConnect
 */
class TwitterConnect extends ConnectBase {
  /**
   * Constructor for twitter connect service.
   *
   * @param {object} params
   * @param {string} params.token: oAuth Token
   * @param {string} params.secret: oAuth Secret
   * @param {string} params.twitter_id: Twitter_id
   * @param {string} params.handle: Handle
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.token = params.token;
    oThis.secret = params.secret;
    oThis.twitterId = params.twitter_id;
    oThis.duplicateRequestIdentifier = oThis.twitterId;
    oThis.handle = params.handle;
    oThis.userTwitterEntity = null;
    oThis.twitterRespHeaders = null;
  }

  /**
   * Fetch Twitter User Obj if present
   *
   * @sets oThis.socialUserObj
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchSocialUser() {
    const oThis = this;

    logger.log('Start::Fetch Twitter User');

    const twitterUserObjCacheResp = await new TwitterUserByTwitterIdsCache({ twitterIds: [oThis.twitterId] }).fetch();

    if (twitterUserObjCacheResp.isFailure()) {
      return Promise.reject(twitterUserObjCacheResp);
    }

    if (twitterUserObjCacheResp.data[oThis.twitterId].id) {
      oThis.socialUserObj = twitterUserObjCacheResp.data[oThis.twitterId];
    }

    return responseHelper.successWithData({});
  }

  /**
   * Method to check whether user has connected twitter
   *
   * @param userObj
   * @private
   */
  _sameSocialConnectUsed(userObj) {
    const propertiesArray = new UserModel().getBitwiseArray('properties', userObj.properties);

    return propertiesArray.indexOf(userConstants.hasTwitterLoginProperty) > -1;
  }

  /**
   * Method to validate Credentials and get profile data from twitter.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndFetchSocialInfo() {
    const oThis = this;

    logger.log('Start::Validate Twitter Credentials');

    let twitterResp = null;

    twitterResp = await new AccountTwitterRequestClass().verifyCredentials({
      oAuthToken: oThis.token,
      oAuthTokenSecret: oThis.secret
    });

    if (twitterResp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_t_c_vtc_2',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {}
        })
      );
    }

    oThis.twitterRespHeaders = twitterResp.data.headers;

    oThis.userTwitterEntity = twitterResp.data.userEntity;

    // validating the front end data
    if (oThis.userTwitterEntity.idStr != oThis.twitterId || oThis.userTwitterEntity.handle != oThis.handle) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_t_c_vtc_3',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {}
        })
      );
    }

    logger.log('End::Validate Twitter Credentials');

    return responseHelper.successWithData({});
  }

  /**
   * Call signup service for twitter connect.
   *
   * @return {void}
   *
   * @private
   */
  async _performSignUp() {
    const oThis = this;

    logger.log('Start::Connect._performSignUp');

    let requestParams = {
      twitterUserObj: oThis.socialUserObj,
      userTwitterEntity: oThis.userTwitterEntity,
      twitterRespHeaders: oThis.twitterRespHeaders,
      token: oThis.token,
      secret: oThis.secret,
      headers: oThis.headers
    };

    Object.assign(requestParams, oThis._appendCommonSignupParams());
    oThis.serviceResp = await new SignupTwitterClass(requestParams).perform();

    logger.log('End::Connect._performSignUp');
  }

  /**
   * Call signup service for twitter connect.
   *
   * @return {void}
   *
   * @private
   */
  async _performLogin() {
    const oThis = this;

    logger.log('Start::Connect._performLogin');

    let requestParams = {
      twitterUserObj: oThis.socialUserObj,
      userTwitterEntity: oThis.userTwitterEntity,
      twitterRespHeaders: oThis.twitterRespHeaders,
      token: oThis.token,
      secret: oThis.secret,
      userId: oThis.userId,
      isNewSocialConnect: oThis.newSocialConnect,
      apiSource: oThis.apiSource
    };

    oThis.serviceResp = await new LoginTwitterClass(requestParams).perform();

    logger.log('End::Connect._performLogin');
  }

  /**
   * Get unique property from social platform info, like email or phone number
   *
   * @returns {{}|{kind: string, value: *}}
   * @private
   */
  _getSocialUserUniqueProperties() {
    const oThis = this;

    if (!oThis.userTwitterEntity.email || !CommonValidators.isValidEmail(oThis.userTwitterEntity.email)) {
      return {};
    }

    return { kind: userIdentifierConstants.emailKind, values: [oThis.userTwitterEntity.email] };
  }

  /**
   * Get current social email from parameters.
   *
   * @returns {null}
   * @private
   */
  _getCurrentSocialEmail() {
    const oThis = this;

    return oThis.userTwitterEntity.email;
  }

  /**
   * Update email in social users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateEmailInSocialUsers() {
    const oThis = this;

    let email = oThis._getCurrentSocialEmail();

    await new TwitterUserModel()
      .update({ email: email })
      .where({ id: oThis.socialUserObj.id })
      .fire();
    await TwitterUserModel.flushCache(oThis.socialUserObj);
  }
}

module.exports = TwitterConnect;
