const rootPrefix = '../..',
  WebhookPost = require(rootPrefix + '/lib/webhook/WebhookPost'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  webhookEndpointConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEndpoint');

/**
 * Class to publish webhook.
 *
 * @class PublishWebhook
 */
class PublishWebhook {
  /**
   * Constructor to publish webhook.
   *
   * @param {object} params
   * @param {object} params.formattedParams
   * @param {string} params.formattedParams.id
   * @param {string} params.formattedParams.topic
   * @param {number} params.formattedParams.created_at
   * @param {string} params.formattedParams.webhook_id
   * @param {string} params.formattedParams.version
   * @param {object} params.formattedParams.data
   * @param {object} params.webhookEndpoint
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.formattedParams = params.formattedParams;
    oThis.webhookEndpoint = params.webhookEndpoint;

    oThis.decryptedSecretSalt = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    await oThis.validateAndSanitize();

    return oThis.fireWebhook();
  }

  /**
   * Validate and sanitize.
   *
   * @returns {Promise<*>}
   */
  async validateAndSanitize() {
    const oThis = this;

    if (!CommonValidators.validateNonEmptyObject(oThis.formattedParams)) {
      return responseHelper.error({
        internal_error_identifier: 'l_we_sw_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { formattedParams: oThis.formattedParams }
      });
    }

    if (!CommonValidators.validateNonEmptyObject(oThis.webhookEndpoint)) {
      return responseHelper.error({
        internal_error_identifier: 'l_we_sw_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: { webhookEndpoint: oThis.webhookEndpoint }
      });
    }

    if (oThis.webhookEndpoint.status !== webhookEndpointConstants.activeStatus) {
      return responseHelper.error({
        internal_error_identifier: 'l_we_sw_3',
        api_error_identifier: 'something_went_wrong',
        debug_options: { webhookEndpoint: oThis.webhookEndpoint }
      });
    }

    if (!oThis.webhookEndpoint.secret || !oThis.webhookEndpoint.apiVersion || !oThis.webhookEndpoint.endpoint) {
      return responseHelper.error({
        internal_error_identifier: 'l_we_sw_4',
        api_error_identifier: 'something_went_wrong',
        debug_options: { webhookEndpoint: oThis.webhookEndpoint }
      });
    }
  }

  /**
   * Fire webhook.
   *
   * @returns {Promise<*|result>}
   */
  async fireWebhook() {
    const oThis = this;

    const webhookSecrets = [await oThis.getSecret(oThis.webhookEndpoint.secret)];
    if (oThis.webhookEndpoint.graceSecret && oThis.webhookEndpoint.graceExpiryAt > Math.floor(Date.now() / 1000)) {
      webhookSecrets.push(await oThis.getSecret(oThis.webhookEndpoint.graceSecret));
    }

    const webhookApiVersion = oThis.webhookEndpoint.apiVersion;
    const apiEndpoint = oThis.webhookEndpoint.endpoint.replace(/\/$/, '');

    const webhookPostObject = new WebhookPost({
      webhookSecrets: webhookSecrets,
      apiEndpoint: apiEndpoint,
      apiVersion: webhookApiVersion
    });

    return webhookPostObject.post(oThis.formattedParams);
  }

  /**
   * Get secret.
   *
   * @param {string} secret
   *
   * @sets oThis.decryptedSecretSalt
   *
   * @returns {Promise<string>}
   */
  async getSecret(secret) {
    const oThis = this;

    oThis.decryptedSecretSalt =
      oThis.decryptedSecretSalt || localCipher.decrypt(coreConstants.CACHE_SHA_KEY, oThis.webhookEndpoint.secretSaltLc);

    return localCipher.decrypt(oThis.decryptedSecretSalt, secret);
  }
}

module.exports = PublishWebhook;
