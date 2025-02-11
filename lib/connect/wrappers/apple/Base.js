/**
 * Apple auth base
 *
 * @module lib/connect/wrappers/apple/Base
 */

const rootPrefix = '../../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class AppleBase {
  constructor(params) {
    const oThis = this;
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    let requestParams = oThis._requestParams(),
      response = await oThis.fireRequest(requestParams);

    if (response.isFailure()) {
      return Promise.reject(response);
    }

    let finalResponse = null;
    try {
      finalResponse = JSON.parse(response.data.responseData);
    } catch (err) {
      logger.error('Error in json parse of response');
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_sc_a_a_b_1',
          api_error_identifier: 'resource_not_found',
          debug_options: { Error: err }
        })
      );
    }

    return finalResponse;
  }

  /**
   * Fire request to google
   *
   * @returns {Promise<void>}
   */
  async fireRequest(params) {
    const oThis = this;

    let responseData = null,
      HttpLibObj = new HttpLibrary({
        resource: oThis._getCompleteUrl(),
        header: oThis._getHeader()
      });
    if (oThis._requestType == 'GET') {
      responseData = await HttpLibObj.get(params).catch(function(err) {
        return err;
      });
    } else if (oThis._requestType == 'POST') {
      responseData = await HttpLibObj.post(params).catch(function(err) {
        return err;
      });
    }

    return responseData;
  }
}
module.exports = AppleBase;
