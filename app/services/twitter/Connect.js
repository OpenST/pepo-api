const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TwitterUserByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByTwitterIds'),
  AccountTwitterRequestClass = require(rootPrefix + '/lib/twitter/oAuth1.0/Account'),
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

    await oThis._fetchTwitterUserAndValidateCredentials();

    await oThis._performAction();

    return Promise.resolve(oThis.serviceResp);
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

    const twitterUserObjCacheResp = await new TwitterUserByTwitterIdsCache({ twitterIds: oThis.twitterId }).fetch();

    if (twitterUserObjCacheResp.isFailure()) {
      return Promise.reject(userObjCacheResp);
    }

    if (twitterUserObjCacheResp.data[oThis.twitterId].userId) {
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

    let twitterResp = new AccountTwitterRequestClass.verifyCredentials({
      oAuthToken: oThis.token,
      oAuthTokenSecret: oThis.secret
    }).catch(function(err) {
      logger.error('Error while validate Credentials for twitter: ', err);
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_t_c_vtc_1',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {}
        })
      );
    });

    if (twitterResp.isFailure()) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_t_c_vtc_2',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {}
        })
      );
    }

    oThis.userTwitterEntity = twitterResp.data.userEntity;

    if (oThis.userTwitterEntity.idStr != oThis.twitterId || oThis.userTwitterEntity.handle != oThis.handle) {
      return Promise.reject(
        responseHelper.paramValidationError({
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

    let requestParams = {
      twitterUserObj: oThis.twitterUserObj,
      userTwitterEntity: oThis.userTwitterEntity,
      token: oThis.token,
      secret: oThis.secret
    };

    if (!oThis.twitterUserObj || !oThis.twitterUserObj.userId) {
      oThis.serviceResp = await new LoginTwitterClass(requestParams).perform();
    } else {
      oThis.serviceResp = await new SignupTwitterClass(requestParams).perform();
    }

    return;
  }
}

module.exports = TwitterConnect;
