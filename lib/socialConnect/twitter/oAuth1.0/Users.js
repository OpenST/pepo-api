/**
 * Twitter Users
 *
 * @module lib/socialConnect/twitter/oAuth1.0/Users
 */
const rootPrefix = '../../../..',
  Base = require(rootPrefix + '/lib/socialConnect/twitter/oAuth1.0/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  UserTwitterEntityClass = require(rootPrefix + '/lib/socialConnect/twitter/entities/User'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Twitter Users.
 *
 * @class Users
 */
class Users extends Base {
  /**
   * Constructor
   *
   * @constructor
   */
  constructor() {
    super();
    const oThis = this;

    oThis.resource = 'https://api.twitter.com/1.1/users';
  }

  /**
   * Get Users by twitterIds(followed by current user)
   *
   * @returns {Promise<*>}
   */
  async lookup(params) {
    const oThis = this;

    let twitterIds = params.twitterIds,
      includeEntities = params.includeEntities || false;

    let completeUrl = oThis.resource + '/lookup.json';
    let requestParams = { user_id: twitterIds.join(), include_entities: includeEntities };

    let oAuthCredentials = {
        oAuthConsumerKey: coreConstants.TWITTER_CONSUMER_KEY,
        oAuthConsumerSecret: coreConstants.TWITTER_CONSUMER_SECRET,
        oAuthToken: params.oAuthToken,
        oAuthTokenSecret: params.oAuthTokenSecret
      },
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
    let finalResp = {};

    for (let i = 0; i < parsedResponse.data.response.length; i++) {
      let userEntity = new UserTwitterEntityClass(parsedResponse.data.response[i]);

      finalResp[userEntity.idStr] = userEntity;
    }

    return responseHelper.successWithData({ response: finalResp });
  }
}

module.exports = Users;
