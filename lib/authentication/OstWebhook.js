const rootPrefix = '../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  ostPlatformSdk = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  SecureWebhookCache = require(rootPrefix + '/lib/cacheManagement/single/SecureWebhook'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

class AuthOstWebhook {
  /**
   * Constructor
   *
   * @param params
   */
  constructor(params) {
    const oThis = this;

    oThis.webhookParams = params.webhookParams;
    oThis.requestHeaders = params.requestHeaders;

    oThis.webhookCacheData = null;
  }

  /**
   * Perform
   *
   * @return {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    await oThis._validateWebhookParams();

    await oThis._valiadateRequestHeaders();

    await oThis._fetchWebhookData();

    await oThis._validateSignature();

    return responseHelper.successWithData({});
  }

  /**
   * Validate Webhook Params
   *
   * @return {Promise<*>}
   *
   * @private
   */
  async _validateWebhookParams() {
    const oThis = this;

    if (!CommonValidator.validateObject(oThis.webhookParams)) {
      return oThis._unauthorizedResponse('l_a_ow_vwp_1');
    }

    if (!CommonValidator.validateObject(oThis.requestHeaders)) {
      return oThis._unauthorizedResponse('l_a_ow_vwp_2');
    }

    if (!CommonValidator.validateUuidV4(oThis.webhookParams.webhook_id)) {
      return oThis._unauthorizedResponse('l_a_ow_vwp_3');
    }
  }

  /**
   * Validate request headers
   *
   * @return {Promise<void>}
   * @private
   */
  async _valiadateRequestHeaders() {
    const oThis = this;

    let version = oThis.requestHeaders['version'];

    if (version != '2') {
      return oThis._unauthorizedResponse('l_a_ow_vrh_1');
    }

    if (!CommonValidator.validateTimestamp(oThis.requestHeaders['api-request-timestamp'])) {
      return oThis._unauthorizedResponse('l_a_ow_vrh_2');
    }

    let apiSignature = oThis.requestHeaders['api-signature'];

    if (!CommonValidator.validateString(apiSignature)) {
      return oThis._unauthorizedResponse('l_a_ow_vrh_3');
    }

    let numberOfSignatures = apiSignature.split(',').length;

    if (!(numberOfSignatures > 0) || numberOfSignatures <= 2) {
      return oThis._unauthorizedResponse('l_a_ow_vrh_4');
    }

    // TODO: check for characters allowed in signature
  }

  /**
   * Fetch webhook data
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _fetchWebhookData() {
    const oThis = this;

    let webhookData = await new SecureWebhookCache({ ostId: oThis.webhookParams.webhook_id }).fetch();
    if (webhookData.isFailure() || !(webhookData.data || {}).ost_id) {
      return oThis._unauthorizedResponse('l_a_ow_fwd_1');
    }

    oThis.webhookCacheData = webhookData.data;
  }

  /**
   * Validate signature
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _validateSignature() {
    let signature = oThis.requestHeaders['api-signature'],
      version = oThis.requestHeaders['version'],
      requestTimestamp = oThis.requestHeaders['api-request-timestamp'],
      stringifiedData = JSON.stringify(oThis.webhookParams);

    let encryptedEncryptionSalt = oThis.webhookCacheData.encryptionSaltLc,
      encryptionSaltD = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, encryptedEncryptionSalt);

    let webhookSecret = localCipher.decrypt(encryptionSaltD, oThis.webhookCacheData.secret);

    let validSignature = await ostPlatformSdk.verifyWebhookSignature(
      version,
      stringifiedData,
      requestTimestamp,
      signature,
      webhookSecret
    );

    if (!validSignature) {
      return oThis._unauthorizedResponse('l_a_ow_vs_1');
    }
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
