const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TwitterAuthTokenModel = require(rootPrefix + '/app/models/mysql/TwitterAuthToken'),
  AuthorizationTwitterRequestClass = require(rootPrefix + '/lib/connect/wrappers/twitter/oAuth1.0/Authorization'),
  twitterAuthTokenConstants = require(rootPrefix + '/lib/globalConstant/twitterAuthToken'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseEntity = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for getting request token from twitter.
 *
 * @class GetRequestToken
 */
class GetRequestToken extends ServiceBase {
  /**
   * Constructor for getting request token from twitter.
   *
   * @param {object} params
   * @param {string} params.invite
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
   * Get twitter request token
   *
   * @returns {Promise<unknown>}
   * @private
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
        [responseEntity.redirectUrl]: twitterRedirectUrl,
        dataCookieValue: dataCookieValue
      })
    );
  }

  /**
   * Fetch request token from twitter
   *
   * @returns {Promise<*|result>}
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
          internal_error_identifier: 's_c_gtrt_1',
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
   * Insert in twitter auth tokens model
   *
   * @returns {Promise<never>}
   * @private
   */
  async _insertTwitterTokens() {
    const oThis = this;

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
  }
}

module.exports = GetRequestToken;
