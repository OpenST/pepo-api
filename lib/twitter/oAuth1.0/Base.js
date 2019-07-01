/**
 * Twitter Oauth Base
 *
 * @module lib/twitter/oauth1.0/Base
 */
const rootPrefix = '../../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  oAuth1Helper = require(rootPrefix + '/helpers/oAuth1'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest');

/**
 * Class for Twitter oauth authorization base.
 *
 * @class Base
 */
class Base {
  /**
   * Constructor
   *
   * @constructor
   */
  constructor() {}

  /**
   * Fire Http Request
   *
   * @param {Object} authorizationHeaderParams
   * @param {String} completeUrl
   * @param {Object} queryParams
   * @returns {Promise<*>}
   * @private
   */
  async _fireRequest(authorizationHeaderParams, completeUrl, queryParams) {
    const oThis = this;

    let authorizationHeader = await new oAuth1Helper(authorizationHeaderParams).perform();

    if (authorizationHeader.isFailure()) {
      return Promise.reject(authorizationHeader);
    }

    let header = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: authorizationHeader.data.authorizationHeaderStr
    };

    let HttpLibObj = new HttpLibrary({ resource: completeUrl, header: header }),
      responseData = await HttpLibObj.post(queryParams).catch(function(err) {
        return err;
      });

    if (responseData.isFailure()) {
      return Promise.reject(responseData);
    }

    let parsedResponse = oThis._parseOAuthTokenResponse(responseData.data);
    if (parsedResponse.isFailure()) {
      return Promise.reject(parsedResponse);
    }

    return parsedResponse;
  }

  /**
   * Parse oAuth token response
   *
   * @param {Object} oAuthResponse
   *
   * @returns {ResultBase}
   * @private
   */
  _parseOAuthTokenResponse(oAuthResponse) {
    const oThis = this;

    if (oAuthResponse.response.status == 200) {
      let parsedResponseHash = basicHelper.parseAmpersandSeparatedKeyValue(oAuthResponse.responseData);
      return responseHelper.successWithData(parsedResponseHash);
    } else {
      return responseHelper.error({
        internal_error_identifier: 'l_t_oa_a_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { failureReason: oAuthResponse }
      });
    }
  }
}

module.exports = Base;
