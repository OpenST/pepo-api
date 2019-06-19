const rootPrefix = '../..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  SecureWebhookCache = require(rootPrefix + '/lib/cacheManagement/single/SecureWebhook'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  ostPlatformSdk = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper');

/**
 * Class to validate webhooks received from OST.
 *
 * @class AuthOstWebhook
 */
class AuthOstWebhook {
  /**
   * Constructor to validate webhooks received from OST.
   *
   * @param {object} params
   * @param {object} params.webhookParams
   * @param {object} params.requestHeaders
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.webhookParams = params.webhookParams;
    oThis.requestHeaders = params.requestHeaders;

    oThis.webhookCacheData = null;
  }

  /**
   * Perform.
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
   * Validate webhook params.
   *
   * @return {Promise<*>}
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
   * Validate request headers.
   *
   * @return {Promise<void>}
   * @private
   */
  async _valiadateRequestHeaders() {
    const oThis = this;

    const version = oThis.requestHeaders['ost-version'];

    if (version !== 'v2') {
      return oThis._unauthorizedResponse('l_a_ow_vrh_1');
    }

    if (!CommonValidator.validateTimestamp(oThis.requestHeaders['ost-timestamp'])) {
      return oThis._unauthorizedResponse('l_a_ow_vrh_2');
    }

    const apiSignature = oThis.requestHeaders['ost-signature'];

    if (!CommonValidator.validateString(apiSignature)) {
      return oThis._unauthorizedResponse('l_a_ow_vrh_3');
    }

    const numberOfSignatures = apiSignature.split(',').length;

    if (numberOfSignatures < 1 || numberOfSignatures > 2) {
      return oThis._unauthorizedResponse('l_a_ow_vrh_4');
    }

    // TODO: check for characters allowed in signature
  }

  /**
   * Fetch webhook data.
   *
   * @sets oThis.webhookCacheData
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchWebhookData() {
    const oThis = this;

    const webhookData = await new SecureWebhookCache({ ostId: oThis.webhookParams.webhook_id }).fetch();

    if (webhookData.isFailure() || !(webhookData.data || {}).ostId) {
      return oThis._unauthorizedResponse('l_a_ow_fwd_1');
    }

    oThis.webhookCacheData = webhookData.data;
  }

  /**
   * Validate signature.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateSignature() {
    const oThis = this;

    const signature = oThis.requestHeaders['ost-signature'],
      version = oThis.requestHeaders['ost-version'],
      requestTimestamp = oThis.requestHeaders['ost-timestamp'],
      stringifiedData = JSON.stringify(oThis.webhookParams);

    const encryptedEncryptionSalt = oThis.webhookCacheData.encryptionSaltLc,
      encryptionSaltD = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, encryptedEncryptionSalt);

    const webhookSecret = localCipher.decrypt(encryptionSaltD, oThis.webhookCacheData.secret);

    const validSignature = await ostPlatformSdk.verifyWebhookSignature(
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
   * Unauthorized response.
   *
   * @param {string} code
   *
   * @returns {Promise<never>}
   * @private
   */
  _unauthorizedResponse(code) {
    // TODO: Send error email
    return Promise.reject(
      responseHelper.error({
        internal_error_identifier: code,
        api_error_identifier: 'unauthorized_api_request'
      })
    );
  }
}

module.exports = AuthOstWebhook;
