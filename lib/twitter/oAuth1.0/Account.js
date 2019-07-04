/**
 * Twitter Authorization
 *
 * @module lib/twitter/oauth1.0/Account
 */
const rootPrefix = '../../..',
  Base = require(rootPrefix + '/lib/twitter/oauth1.0/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  UserTwitterEntityClass = require(rootPrefix + '/lib/twitter/entities/User'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Twitter Account.
 *
 * @class Account
 */
class Account extends Base {
  /**
   * Constructor
   *
   * @constructor
   */
  constructor() {
    super();
    const oThis = this;

    oThis.resource = 'https://api.twitter.com/1.1/account';
  }

  /**
   * Authenticate Credentials
   *
   * @returns {Promise<*>}
   */
  async verifyCredentials(params) {
    const oThis = this;

    let completeUrl = oThis.resource + '/verify_credentials.json';

    let oAuthCredentials = {
        oAuthConsumerKey: coreConstants.TWITTER_CONSUMER_KEY,
        oAuthConsumerSecret: coreConstants.TWITTER_CONSUMER_SECRET,
        oAuthToken: params.oAuthToken,
        oAuthTokenSecret: params.oAuthTokenSecret
      },
      authorizationHeaderParams = {
        requestType: 'GET',
        url: completeUrl,
        oAuthCredentials: oAuthCredentials,
        requestParams: { include_email: true }
      };

    let response = await oThis._fireRequest(authorizationHeaderParams, completeUrl, {});

    let parsedResponse = oThis._parseJsonResponse(response.data);
    if (parsedResponse.isFailure()) {
      return Promise.reject(parsedResponse);
    }

    let userEntity = new UserTwitterEntityClass(parsedResponse.data);

    return responseHelper.successWithData({ userEntity: userEntity });
  }
}

module.exports = Account;
