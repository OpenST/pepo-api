const uuidV4 = require('uuid/v4');

const rootPrefix = '../..',
  KmsWrapper = require(rootPrefix + '/lib/aws/KmsWrapper'),
  WebhookEndpointModel = require(rootPrefix + '/app/models/mysql/webhook/WebhookEndpoint'),
  util = require(rootPrefix + '/lib/util'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  webhookEndpointConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEndpoint'),
  webhookSubscriptionConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookSubscription');

/**
 * Class to create new webhook.
 *
 * @class AddEndpointWebhook
 */
class AddEndpointWebhook {
  /**
   * Constructor to create or update webhook.
   *
   * @param {object} params
   * @param {number} params.client_id: client id
   * @param {string} [params.status]: status
   * @param {string} [params.url]: external url where webhook sent
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.clientId = params.client_id;
    oThis.status = params.status || webhookEndpointConstants.activeStatus;
    oThis.endpointUrl = params.url.toLowerCase();

    oThis.endpoint = null;
    oThis.secretSalt = null;
    oThis.secret = null;
    oThis.uuid = null;
  }

  /**
   * Main performer for class.
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis.getEndpoint();

    await oThis.createEndpoint();

    return responseHelper.successWithData({
      id: oThis.uuid,
      url: oThis.endpointUrl,
      status: webhookEndpointConstants.invertedStatuses[oThis.status],
      updatedTimestamp: Math.floor(Date.now() / 1000)
    });
  }

  /**
   * Validate params.
   *
   * @sets oThis.status
   *
   * @returns {Promise<*>}
   */
  async _validateAndSanitizeParams() {
    // Check topics is not an empty array.
    const oThis = this;

    oThis.status = oThis.status.toUpperCase();

    const validStatuses = basicHelper.deepDup(webhookEndpointConstants.invertedStatuses);

    delete validStatuses[webhookEndpointConstants.deletedStatus];

    if (!validStatuses[oThis.status]) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_we_ae_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_status'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Get endpoint.
   *
   * @sets oThis.endpoint
   *
   * @returns {Promise<void>}
   */
  async getEndpoint() {
    // Query and check if endpoint is already present.
    const oThis = this;

    const endpoints = await new WebhookEndpointModel()
      .select('*')
      .where({ client_id: oThis.clientId, endpoint: oThis.endpointUrl })
      .fire();

    oThis.endpoint = endpoints[0];

    if (
      oThis.endpoint &&
      webhookEndpointConstants.statuses[oThis.endpoint.status] !== webhookEndpointConstants.deletedStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_we_ae_3',
          api_error_identifier: 'endpoint_already_present'
        })
      );
    }
  }

  /**
   * Create endpoint in webhook endpoints table.
   *
   * @sets oThis.uuid, oThis.secret
   *
   * @returns {Promise<never>}
   */
  async createEndpoint() {
    const oThis = this;

    if (oThis.endpoint) {
      oThis.endpointUrl = oThis.endpoint.endpoint.toLowerCase();

      await new WebhookEndpointModel()
        .update({
          status: webhookEndpointConstants.invertedStatuses[oThis.status]
        })
        .where({ id: oThis.endpoint.id })
        .fire();

      oThis.uuid = oThis.endpoint.uuid;
    } else {
      await oThis._generateSalt();

      const secret_salt = oThis.secretSalt.CiphertextBlob;

      oThis.secret = oThis._getEncryptedApiSecret();
      oThis.uuid = uuidV4();

      await new WebhookEndpointModel()
        .insert({
          uuid: oThis.uuid,
          client_id: oThis.clientId,
          endpoint: oThis.endpointUrl,
          secret: oThis.secret,
          secret_salt: secret_salt,
          status: webhookEndpointConstants.invertedStatuses[oThis.status]
        })
        .fire();
    }
  }

  /**
   * Generate secret salt.
   *
   * @sets oThis.secretSalt
   *
   * @returns {Promise}
   * @private
   */
  async _generateSalt() {
    const oThis = this;

    const kmsObj = new KmsWrapper(webhookEndpointConstants.encryptionSecretPurpose);

    oThis.secretSalt = await kmsObj.generateDataKey();
  }

  /**
   * Get encrypted secret.
   *
   * @returns {*}
   * @private
   */
  _getEncryptedApiSecret() {
    const oThis = this;

    const apiSecret = util.generateWebhookSecret();

    return localCipher.encrypt(oThis.secretSalt.Plaintext, apiSecret);
  }

  /**
   * Clear cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _clearCache() {
    const oThis = this;

    await WebhookEndpointModel.flushCache({ uuid: oThis.uuid });
  }
}

module.exports = AddEndpointWebhook;
