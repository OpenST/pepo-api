const rootPrefix = '../..',
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  jwtAuth = require(rootPrefix + '/lib/jwtAuth'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to make API calls to Image Resizer.
 *
 * @class ImageResizer
 */
class ImageResizer {
  /**
   * Resize image.
   *
   * @param {object} requestData
   *
   * @returns {Promise<*|*|*>}
   */
  resizeImage(requestData) {
    const oThis = this;

    return oThis._sendPost('/image/resize', requestData);
  }

  /**
   * Send post request.
   *
   * @param {string} path
   * @param {object} requestData
   *
   * @returns {Promise<result>}
   * @private
   */
  async _sendPost(path, requestData) {
    const completeUrl = coreConstants.PR_API_BASE_URL + '' + path,
      queryParams = { token: jwtAuth.issueToken(requestData, 'pepoApi') };

    logger.log('Calling image resizer API GET: ' + completeUrl + '\n\n' + JSON.stringify(queryParams));

    const response = await new HttpLibrary({ resource: completeUrl }).post(queryParams);

    if (response.isFailure()) {
      return response;
    }

    const responseData = JSON.parse(response.data.responseData);

    if (!responseData.success) {
      return responseHelper.error({
        internal_error_identifier: 'l_p_ir_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { error: responseData.err }
      });
    }

    return responseHelper.successWithData(responseData.data);
  }
}

module.exports = new ImageResizer();
