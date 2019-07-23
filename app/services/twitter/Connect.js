const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TwitterUserByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByTwitterIds'),
  AccountTwitterRequestClass = require(rootPrefix + '/lib/twitter/oAuth1.0/Account'),
  ReplayAttackCache = require(rootPrefix + '/lib/cacheManagement/single/ReplayAttackOnTwitterConnect'),
  SignupTwitterClass = require(rootPrefix + '/app/services/twitter/Signup'),
  LoginTwitterClass = require(rootPrefix + '/app/services/twitter/Login'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for Twitter Connect service.
 *
 * @class TwitterConnect
 */
class TwitterConnect extends ServiceBase {
  /**
   * Constructor for signup service.
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
    oThis.handle = params.handle;

    oThis.userTwitterEntity = null;
    oThis.twitterUserObj = null;
    oThis.serviceResp = null;
  }

  /**
   * Perform: Perform user creation.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateDuplicateRequest();

    await oThis._fetchTwitterUserAndValidateCredentials();

    await oThis._performAction();

    return Promise.resolve(oThis.serviceResp);
  }

  /**
   * Allow the api only if not recently used within 1 sec
   *
   * @return {Promise<Result>}
   * @private
   */
  async _validateDuplicateRequest() {
    const oThis = this;
    logger.log('Start::_validateDuplicateRequest');

    const TwitterConnectOnTwitterIdResp = await new ReplayAttackCache({ twitterId: oThis.twitterId }).fetch();

    if (TwitterConnectOnTwitterIdResp.isFailure()) {
      return Promise.reject(TwitterConnectOnTwitterIdResp);
    }

    if (TwitterConnectOnTwitterIdResp.data > 1) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_t_c_vdr_1',
          api_error_identifier: 'could_not_proceed'
        })
      );
    }

    logger.log('End::_validateDuplicateRequest');

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
    }

    logger.log('End::Fetch Twitter User');
    return responseHelper.successWithData({});
  }

  /**
   * Verify Credentials and get profile data from twitter.
   *
   * @sets oThis.userTwitterEntity
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
        logger.error('Error while validate Credentials for twitter: ', err);
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 's_t_c_vtc_1',
            api_error_identifier: 'unauthorized_api_request',
            debug_options: {}
          })
        );
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
   * Call signup or login service as needed for twitter connect.
   *
   * @return {void}
   *
   * @private
   */
  async _performAction() {
    const oThis = this;
    logger.log('Start::Connect._performAction');

    let requestParams = {
      twitterUserObj: oThis.twitterUserObj,
      userTwitterEntity: oThis.userTwitterEntity,
      token: oThis.token,
      secret: oThis.secret
    };

    // twitterUserObj may or may not be present. also if present, it might not be of a Pepo user.
    if (!oThis.twitterUserObj || !oThis.twitterUserObj.userId) {
      logger.log('Twitter::Connect signup');
      oThis.serviceResp = await new SignupTwitterClass(requestParams).perform();
    } else {
      logger.log('Twitter::Connect login');
      oThis.serviceResp = await new LoginTwitterClass(requestParams).perform();
    }

    logger.log('End::Connect._performAction');
  }
}

module.exports = TwitterConnect;
