const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TwitterAuthTokenModel = require(rootPrefix + '/app/models/mysql/TwitterAuthToken'),
  AuthorizationTwitterRequestClass = require(rootPrefix + '/lib/socialConnect/twitter/oAuth1.0/Authorization'),
  twitterAuthTokenConstants = require(rootPrefix + '/lib/globalConstant/twitterAuthToken'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for Twitter PreLaunchTwitterConnect for Pre Launch Invite.
 *
 * @class PreLaunchTwitterConnect
 */
class PreLaunchTwitterConnect extends ServiceBase {
  /**
   * Constructor for signup service.
   *
   * @param {object} params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.inviteCode = params.invite;

    oThis.twitterAuthTokenObj = {};
    oThis.twitterRespData = null;
  }

  /**
   * Perform: Perform user creation.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchRequestToken();

    await oThis._insertTwitterTokens();

    let dataCookieValue = oThis.inviteCode
      ? JSON.stringify({
          i: oThis.inviteCode
        })
      : null;

    let twitterRedirectUrl = coreConstants.TWITTER_OAUTH_URL + oThis.twitterAuthTokenObj.token;

    return Promise.resolve(
      responseHelper.successWithData({
        twitterRedirectUrl: twitterRedirectUrl,
        dataCookieValue: dataCookieValue
      })
    );
  }

  /**
   * Verify Credentials and get profile data from twitter.
   *
   * @sets oThis.userTwitterEntity
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchRequestToken() {
    const oThis = this;
    logger.log('Start::_fetchRequestToken');

    let twitterResp = null;

    twitterResp = await new AuthorizationTwitterRequestClass().requestToken();

    if (twitterResp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_pli_rt_vtc_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }

    oThis.twitterRespData = twitterResp.data;

    logger.log('End::_fetchRequestToken');

    return responseHelper.successWithData({});
  }

  /**
   * Call signup or login service as needed for twitter connect.
   *
   * @return {void}
   *
   * @private
   */
  async _insertTwitterTokens() {
    const oThis = this;
    logger.log('Start::PreLaunchTwitterConnect._performAction');

    let insertData = {
      token: oThis.twitterRespData.oAuthToken,
      secret: oThis.twitterRespData.oAuthTokenSecret,
      status: twitterAuthTokenConstants.invertedStatuses[twitterAuthTokenConstants.activeStatus]
    };
    // Insert token user in database.
    const insertResponse = await new TwitterAuthTokenModel().insert(insertData).fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in TwitterAuthToken table.');
      return Promise.reject(new Error('Error while inserting data in TwitterAuthToken table.'));
    }

    insertData.id = insertResponse.insertId;
    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    oThis.twitterAuthTokenObj = new TwitterAuthTokenModel().formatDbData(insertData);
    await TwitterAuthTokenModel.flushCache(oThis.twitterAuthTokenObj);

    logger.log('End::PreLaunchTwitterConnect._performAction');
  }
}

module.exports = PreLaunchTwitterConnect;
