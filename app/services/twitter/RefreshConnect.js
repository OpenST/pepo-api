const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  AccountTwitterRequestClass = require(rootPrefix + '/lib/socialConnect/twitter/oAuth1.0/Account'),
  TwitterUserByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByTwitterIds'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  SecureTwitterUserExtendedByTwitterUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/single/SecureTwitterUserExtendedByTwitterUserId'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

/**
 * Class for Refresh twitter connect service.
 *
 * @class RefreshConnect
 */
class RefreshConnect extends ServiceBase {
  /**
   * Constructor for refresh connect service.
   *
   * @param {object} params
   * @param {string} params.token: oAuth Token
   * @param {string} params.secret: oAuth Secret
   * @param {string} params.twitter_id: Twitter_id
   * @param {object} params.current_user: Current user
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
    oThis.handle = params.handle;
    oThis.currentUserId = +params.current_user.id;

    oThis.userId = null;
    oThis.twitterUserObj = null;
    oThis.twitterRespHeaders = null;
  }

  /**
   * Perform: Perform refresh connect.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchTwitterUserAndValidateCredentials();

    await oThis._fetchSecureUser();

    await oThis._updateHandleInTwitterUsers();

    await oThis._refreshConnect();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch Twitter User Obj if present and Validate Credentials.
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchTwitterUserAndValidateCredentials() {
    const oThis = this;
    logger.log('Start::TwitterUser And Validate Credentials');

    const promisesArray = [];

    promisesArray.push(oThis._fetchTwitterUser());
    promisesArray.push(oThis._validateTwitterCredentials());

    await Promise.all(promisesArray);

    logger.log('End::TwitterUser And Validate Credentials');

    return responseHelper.successWithData({});
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

    const twitterUserObjCacheResp = await new TwitterUserByTwitterIdsCache({ twitterIds: [oThis.twitterId] }).fetch();

    if (twitterUserObjCacheResp.isFailure()) {
      return Promise.reject(twitterUserObjCacheResp);
    }

    if (twitterUserObjCacheResp.data[oThis.twitterId].id) {
      oThis.twitterUserObj = twitterUserObjCacheResp.data[oThis.twitterId];
    } else {
      logger.error('Error: Trying refresh for user not signed up');
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_t_rc_ftu_1',
          api_error_identifier: 'invalid_twitter_user',
          debug_options: {}
        })
      );
    }

    oThis.userId = oThis.twitterUserObj.userId;

    if (oThis.currentUserId != oThis.userId) {
      logger.error('Error: Trying refresh from user other than current');
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_t_rc_ftu_2',
          api_error_identifier: 'invalid_twitter_user',
          debug_options: {}
        })
      );
    }

    logger.log('End::Fetch Twitter User');
    return responseHelper.successWithData({});
  }

  /**
   * Verify Credentials and get profile data from twitter.
   *
   *
   * @return {Promise<Result>}
   * @private
   */
  async _validateTwitterCredentials() {
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
          internal_error_identifier: 's_t_rc_vtc_2',
          api_error_identifier: 'invalid_twitter_user',
          debug_options: {}
        })
      );
    }

    oThis.twitterRespHeaders = twitterResp.data.headers;

    let userTwitterEntity = twitterResp.data.userEntity;

    // validating the front end data
    if (userTwitterEntity.idStr != oThis.twitterId || userTwitterEntity.handle != oThis.handle) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_t_rc_vtc_3',
          api_error_identifier: 'invalid_twitter_user',
          debug_options: {}
        })
      );
    }

    logger.log('End::Validate Twitter Credentials');

    return responseHelper.successWithData({});
  }

  /**
   * Fetch Secure User Obj.
   *
   * @sets oThis.secureUserObj
   *
   * @return {Promise<Result>}
   *
   * @private
   */
  async _fetchSecureUser() {
    const oThis = this;

    logger.log('Start::Fetching Secure User for Refresh Connect');

    const secureUserRes = await new SecureUserCache({ id: oThis.userId }).fetch();

    if (secureUserRes.isFailure()) {
      return Promise.reject(secureUserRes);
    }

    let secureUserObj = secureUserRes.data;

    if (secureUserObj.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_t_rc_fsu_1',
          api_error_identifier: 'invalid_twitter_user',
          debug_options: {}
        })
      );
    }

    oThis.decryptedEncryptionSalt = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, secureUserObj.encryptionSaltLc);

    logger.log('End::Fetching Secure User for Refresh Connect');

    return responseHelper.successWithData({});
  }

  /**
   * Update handle in twitter users
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateHandleInTwitterUsers() {
    const oThis = this;

    if (oThis.twitterUserObj.handle && oThis.twitterUserObj.handle.toLowerCase() === oThis.handle.toLowerCase()) {
      return responseHelper.successWithData({});
    }

    let twitterUserObj = new TwitterUserModel();

    await twitterUserObj
      .update({
        handle: oThis.handle
      })
      .where({
        twitter_id: oThis.twitterId
      })
      .fire();

    oThis.twitterUserObj.handle = oThis.handle;
    return TwitterUserModel.flushCache(oThis.twitterUserObj);
  }

  /**
   * Update Twitter User Extended object twitter credentials and status.
   *
   * @return {Promise<Result>}
   * @private
   */
  async _refreshConnect() {
    const oThis = this;
    logger.log('Start::Update Twitter User Extended for refresh connect', oThis.twitterUserObj);

    const eSecretKms = localCipher.encrypt(oThis.decryptedEncryptionSalt, oThis.secret);

    const secureTwitterUserExtendedRes = await new SecureTwitterUserExtendedByTwitterUserIdCache({
      twitterUserId: oThis.twitterUserObj.id
    }).fetch();

    if (secureTwitterUserExtendedRes.isFailure()) {
      return Promise.reject(secureTwitterUserExtendedRes);
    }

    let twitterUserExtendedObj = secureTwitterUserExtendedRes.data;
    let accessType = twitterUserExtendedConstants.getAccessLevelFromTwitterHeader(oThis.twitterRespHeaders);

    await new TwitterUserExtendedModel()
      .update({
        token: oThis.token,
        secret: eSecretKms,
        access_type: twitterUserExtendedConstants.invertedAccessTypes[accessType],
        status: twitterUserExtendedConstants.invertedStatuses[twitterUserExtendedConstants.activeStatus]
      })
      .where({ id: twitterUserExtendedObj.id })
      .fire();

    await TwitterUserExtendedModel.flushCache({
      id: twitterUserExtendedObj.id,
      twitterUserId: oThis.twitterUserObj.id
    });

    logger.log('End::Update Twitter User Extended for refresh connect');

    return responseHelper.successWithData({});
  }
}

module.exports = RefreshConnect;
