/*
 * Make API calls to Image Resizer
 *
 */
const rootPrefix = '../..',
  jwtAuth = require(rootPrefix + '/lib/jwtAuth'),
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

class ImageResizer {
  resizeImage(requestData) {
    const oThis = this;

    return oThis._sendPost('/image/resize', requestData);
  }

  async _sendPost(path, requestData) {
    const oThis = this;

    const completeUrl = coreConstants.PR_API_BASE_URL + '' + path,
      queryParams = { token: jwtAuth.issueToken(requestData, 'pepoApi') };

    logger.log('Calling image resizer API GET: ' + completeUrl + '\n\n' + JSON.stringify(queryParams));

    let HttpLibObj = new HttpLibrary({ resource: completeUrl });

    let response = await HttpLibObj.post(queryParams);

    if (response.isFailure()) {
      return response;
    }

    let responseData = JSON.parse(response.data.responseData);
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
