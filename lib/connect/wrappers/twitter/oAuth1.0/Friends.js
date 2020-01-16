/**
 * Twitter Friends
 *
 * @module lib/connect/wrappers/twitter/oAuth1.0/Friends
 */
const rootPrefix = '../../../../..',
  Base = require(rootPrefix + '/lib/connect/wrappers/twitter/oAuth1.0/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Twitter Friends.
 *
 * @class Friends
 */
class Friends extends Base {
  /**
   * Constructor
   *
   * @constructor
   */
  constructor() {
    super();
    const oThis = this;

    oThis.resource = 'https://api.twitter.com/1.1/friends';
  }

  /**
   * Get IDs of Friends(followed by current user)
   *
   * @returns {Promise<*>}
   */
  async getIds(params) {
    const oThis = this;

    let twitterId = params.twitterId,
      cursor = params.cursor,
      count = params.count || 5000;

    let completeUrl = oThis.resource + '/ids.json';
    let requestParams = { user_id: twitterId, stringify_ids: true, count: count };

    if (cursor) {
      requestParams['cursor'] = cursor;
    }

    let oAuthCredentials = {
        oAuthConsumerKey: coreConstants.TWITTER_CONSUMER_KEY,
        oAuthConsumerSecret: coreConstants.TWITTER_CONSUMER_SECRET,
        oAuthToken: params.oAuthToken,
        oAuthTokenSecret: params.oAuthTokenSecret
      },
      //post is recommended for large data
      twitterRequestParams = {
        requestType: 'GET',
        completeUrl: completeUrl,
        oAuthCredentials: oAuthCredentials,
        requestParams: requestParams
      };

    let response = await oThis._fireRequest(twitterRequestParams);

    let parsedResponse = await oThis._parseJsonResponse(response.data);
    if (parsedResponse.isFailure()) {
      return parsedResponse;
    }

    return responseHelper.successWithData({ response: parsedResponse.data.response });
  }
}

module.exports = Friends;
