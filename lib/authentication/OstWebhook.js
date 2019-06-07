const rootPrefix = '../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  commonValidator = require(rootPrefix + '/lib/validators/Common'),
  ostPlatformSdk = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper');

class AuthOstWebhook {
  /**
   * Constructor
   *
   * @param cookieValue
   */
  constructor(params) {
    const oThis = this;

    oThis.decodedParams = params.decodedParams;
  }

  /**
   * Perform
   *
   * @return {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    return Promise.resolve(responseHelper.successWithData({}));

    await oThis._validate();

    return responseHelper.successWithData({});
  }

  /**
   * Validate
   *
   * @return {Promise<*>}
   * @private
   */
  async _validate() {
    const oThis = this;
    return oThis._unauthorizedResponse('l_a_lc_v_1');
  }

  /**
   * Unauthorized Response
   *
   * @param code
   * @returns {Promise<never>}
   * @private
   */
  _unauthorizedResponse(code) {
    return Promise.reject(
      responseHelper.error({
        internal_error_identifier: code,
        api_error_identifier: 'unauthorized_api_request'
      })
    );
  }
}

module.exports = AuthOstWebhook;
