const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  AccountTwitterRequestClass = require(rootPrefix + '/lib/twitter/oAuth1.0/Account'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  SecureTwitterUserExtendedByTwitterUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/single/SecureTwitterUserExtendedByTwitterUserId'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

/**
 * Class for Twitter Login service.
 *
 * @class TwitterLogin
 */
class TwitterLogin extends ServiceBase {
  /**
   * Constructor for Twitter Login service.
   *
   * @param {object} params
   * @param {string} params.twitterUserObj: Twitter User Table Obj
   * @param {string} params.userTwitterEntity: User Entity Of Twitter
   * @param {string} params.token: Oauth User Token
   * @param {string} params.secret: Oauth User secret
   *
   * @augments ServiceBase
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

    oThis.userId = oThis.twitterUserObj.userId;

    oThis.secureUserObj = null;
    oThis.tokenUserObj = null;
    oThis.handle = null;

    oThis.decryptedEncryptionSalt = null;
  }

  /**
   * Perform: Perform user creation.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    logger.log('Start::_asyncPerform Twitter login');

    const updateTwitterUserPromise = oThis._fetchSecureUser().then(function() {
      return oThis._updateTwitterUserExtended();
    });

    await oThis._validateTwitterCredentials();

    await oThis._updateHandleInTwitterUsers();

    const promisesArray = [];

    promisesArray.push(updateTwitterUserPromise);
    promisesArray.push(oThis._fetchTokenUser());

    await Promise.all(promisesArray);

    logger.log('End::_asyncPerform Twitter Login');

    return Promise.resolve(oThis._serviceResponse());
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

    logger.log('Start::Fetching Secure User for Twitter login');

    const secureUserRes = await new SecureUserCache({ id: oThis.userId }).fetch();

    if (secureUserRes.isFailure()) {
      return Promise.reject(secureUserRes);
    }

    oThis.secureUserObj = secureUserRes.data;

    if (oThis.secureUserObj.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_t_c_fsu_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_active'],
          debug_options: {}
        })
      );
    }

    oThis.decryptedEncryptionSalt = localCipher.decrypt(
      coreConstants.CACHE_SHA_KEY,
      oThis.secureUserObj.encryptionSaltLc
    );

    logger.log('End::Fetching Secure User for Twitter login');

    return responseHelper.successWithData({});
  }

  /**
   * Update Twitter User Extended object twitter credentials and status.
   *
   * @return {Promise<Result>}
   * @private
   */
  async _updateTwitterUserExtended() {
    const oThis = this;
    logger.log('Start::Update Twitter User Extended for login', oThis.twitterUserObj);

    const eSecretKms = localCipher.encrypt(oThis.decryptedEncryptionSalt, oThis.secret);

    const SecureTwitterUserExtendedRes = await new SecureTwitterUserExtendedByTwitterUserIdCache({
      twitterUserId: oThis.twitterUserObj.id
    }).fetch();

    if (SecureTwitterUserExtendedRes.isFailure()) {
      return Promise.reject(SecureTwitterUserExtendedRes);
    }

    let twitterUserExtendedObj = SecureTwitterUserExtendedRes.data;

    await new TwitterUserExtendedModel()
      .update({
        token: oThis.token,
        secret: eSecretKms,
        status: twitterUserExtendedConstants.invertedStatuses[twitterUserExtendedConstants.activeStatus]
      })
      .where({ id: twitterUserExtendedObj.id })
      .fire();

    await TwitterUserExtendedModel.flushCache({
      id: twitterUserExtendedObj.id,
      twitterUserId: oThis.twitterUserObj.id
    });

    logger.log('End::Update Twitter User Extended for login');

    return responseHelper.successWithData({});
  }

  /**
   * Verify Credentials and get profile data from twitter.
   *
   * @return {Promise<Result>}
   * @private
   */
  async _validateTwitterCredentials() {
    const oThis = this;
    logger.log('Start::Validate Twitter Credentials');

    let twitterResp = null;

    twitterResp = await new AccountTwitterRequestClass()
      .verifyCredentials({
        oAuthToken: oThis.token,
        oAuthTokenSecret: oThis.secret
      })
      .catch(function(err) {
        logger.error('Error while validating Credentials for twitter: ', err);
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 's_t_l_vtc_1',
            api_error_identifier: 'invalid_twitter_user',
            debug_options: {}
          })
        );
      });

    if (twitterResp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_t_l_vtc_2',
          api_error_identifier: 'invalid_twitter_user',
          debug_options: {}
        })
      );
    }

    let userTwitterEntity = twitterResp.data.userEntity;

    if (userTwitterEntity.idStr != oThis.twitterUserObj.twitterId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_t_l_vtc_3',
          api_error_identifier: 'invalid_twitter_user',
          debug_options: {}
        })
      );
    }

    oThis.handle = userTwitterEntity.handle;

    logger.log('End::Validate Twitter Credentials');

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

    let twitterUserObj = new TwitterUserModel();

    await twitterUserObj
      .update({
        handle: oThis.handle
      })
      .where({
        twitter_id: oThis.twitterUserObj.twitterId
      })
      .fire();

    return TwitterUserModel.flushCache(oThis.twitterUserObj);
  }

  /**
   * Fetch token user.
   *
   * @sets oThis.tokenUserObj
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    logger.log('Start::Fetching token user.');

    const tokenUserRes = await new TokenUserDetailByUserIdsCache({ userIds: [oThis.userId] }).fetch();

    if (tokenUserRes.isFailure()) {
      return Promise.reject(tokenUserRes);
    }

    oThis.tokenUserObj = tokenUserRes.data[oThis.userId];

    logger.log('End::Fetching token user.');

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Service response.
   *
   * @return {Promise<void>}
   * @private
   */
  async _serviceResponse() {
    const oThis = this;

    logger.log('Start::Service Response for twitter Login');

    const userLoginCookieValue = new UserModel().getCookieValueFor(oThis.secureUserObj, oThis.decryptedEncryptionSalt, {
      timestamp: Date.now() / 1000
    });

    logger.log('End::Service Response for twitter Login');

    const safeFormattedUserData = new UserModel().safeFormattedData(oThis.secureUserObj);
    const safeFormattedTokenUserData = new TokenUserModel().safeFormattedData(oThis.tokenUserObj);

    return responseHelper.successWithData({
      usersByIdMap: { [safeFormattedUserData.id]: safeFormattedUserData },
      tokenUsersByUserIdMap: { [safeFormattedTokenUserData.userId]: safeFormattedTokenUserData },
      user: safeFormattedUserData,
      tokenUser: safeFormattedTokenUserData,
      userLoginCookieValue: userLoginCookieValue
    });
  }
}

module.exports = TwitterLogin;
