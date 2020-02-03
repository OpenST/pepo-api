const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  util = require(rootPrefix + '/lib/util'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  WebhookEndpointModel = require(rootPrefix + '/app/models/mysql/webhook/WebhookEndpoint'),
  WebhookEndpointByUuidsCache = require(rootPrefix + '/lib/cacheManagement/multi/WebhookEndpointByUuids'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  webhookEndpointConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEndpoint');

/**
 * Class to rotate webhook secret.
 *
 * @class RotateWebhookSecret
 */
class RotateWebhookSecret extends ServiceBase {
  /**
   * Constructor to rotate webhook secret.
   *
   * @param {object} params
   * @param {string} params.uuid: uuid
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.uuid = params.uuid;
    oThis.webhookEndpoint = null;
    oThis.newSecret = null;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchAndValidateWebhookEndpoint();

    await oThis._rotateWebhookSecret();

    logger.log('The new secret after rotation is : ', oThis.newSecret);

    return responseHelper.successWithData({
      secret: oThis.newSecret
    });
  }

  /**
   * Fetch and validate webhook endpoint.
   *
   * @sets oThis.webhookEndpoint
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchAndValidateWebhookEndpoint() {
    const oThis = this;

    const cacheRsp = await new WebhookEndpointByUuidsCache({ uuids: [oThis.uuid] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    if (!cacheRsp.data[oThis.uuid].id) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_w_rs_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_uuid'],
          debug_options: { uuid: oThis.uuid }
        })
      );
    }

    oThis.webhookEndpoint = cacheRsp.data[oThis.uuid];

    if (oThis.webhookEndpoint.status !== webhookEndpointConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_w_rs_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_uuid'],
          debug_options: { uuid: oThis.uuid }
        })
      );
    }
  }

  /**
   * Rotate webhook secret.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _rotateWebhookSecret() {
    const oThis = this;
    const decryptedEncryptionSalt = localCipher.decrypt(
      coreConstants.CACHE_SHA_KEY,
      oThis.webhookEndpoint.secretSaltLc
    );

    oThis.newSecret = util.generateWebhookSecret();

    const apiSecretEncrypted = localCipher.encrypt(decryptedEncryptionSalt, oThis.newSecret);
    const graceExpiryTime = Math.floor(Date.now() / 1000) + webhookEndpointConstants.graceExpiryTime;

    await new WebhookEndpointModel()
      .update({
        secret: apiSecretEncrypted,
        grace_secret: oThis.webhookEndpoint.secret,
        grace_expiry_at: graceExpiryTime
      })
      .where({ id: oThis.webhookEndpoint.id })
      .fire();

    await WebhookEndpointModel.flushCache(oThis.webhookEndpoint);
  }
}

module.exports = RotateWebhookSecret;
