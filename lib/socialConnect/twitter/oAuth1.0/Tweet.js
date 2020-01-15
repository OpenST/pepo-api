/**
 * Tweet/status update
 *
 * @module lib/socialConnect/twitter/oAuth1.0/Tweet
 */
const rootPrefix = '../../../..',
  Base = require(rootPrefix + '/lib/socialConnect/twitter/oAuth1.0/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Tweets
 *
 * @class Tweet
 */
class Tweet extends Base {
  /**
   * Constructor
   *
   * @constructor
   */
  constructor() {
    super();
    const oThis = this;

    oThis.resource = 'https://api.twitter.com/1.1/statuses';
  }

  /**
   * Status update
   *
   * @returns {Promise<*>}
   */
  async tweet(params) {
    const oThis = this;

    let completeUrl = oThis.resource + '/update.json',
      tweetText = params.tweetText;

    let oAuthCredentials = {
        oAuthConsumerKey: coreConstants.TWITTER_CONSUMER_KEY,
        oAuthConsumerSecret: coreConstants.TWITTER_CONSUMER_SECRET,
        oAuthToken: params.oAuthToken,
        oAuthTokenSecret: params.oAuthTokenSecret
      },
      twitterRequestParams = {
        requestType: 'POST',
        completeUrl: completeUrl,
        oAuthCredentials: oAuthCredentials,
        requestParams: { status: tweetText }
      };

    let response = await oThis._fireRequest(twitterRequestParams);

    let parsedResponse = await oThis._parseJsonResponse(response.data);

    if (parsedResponse.isFailure()) {
      return parsedResponse;
    }

    return responseHelper.successWithData({ response: parsedResponse.data.response });
  }
}

module.exports = Tweet;
