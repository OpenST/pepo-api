/**
 * Module to create new webhook.
 *
 * @module app/services/webhooks/modify/Base
 */

const uuidV4 = require('uuid/v4');

const rootPrefix = '../..',
  WebhookEndpointModel = require(rootPrefix + '/app/models/mysql/webhook/WebhookEndpoint'),
  WebhookSubscriptionModel = require(rootPrefix + '/app/models/mysql/webhook/WebhookSubscription'),
  KmsWrapper = require(rootPrefix + '/lib/aws/KmsWrapper'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  util = require(rootPrefix + '/lib/util'),
  webhookEndpointConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEndpoint'),
  webhookSubscriptionConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookSubscription');

/**
 * Class to create new webhook.
 *
 * @class AddSubscriptionsWebhook
 */
class AddSubscriptionsWebhook {
  /**
   * Constructor to create update webhook.
   *
   * @param {object} params
   * @param {number} params.client_id: client id
   * @param {array} params.topics: array of {topic_kind,kind_id} to subscribe
   * @param {string} params.endpoint_uuid: uuid of existing endpoint
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.clientId = params.client_id;
    oThis.endpointUuid = params.endpoint_uuid;
    oThis.eventTopics = params.topics;

    oThis.endpoint = null;

    oThis.activateTopicIds = [];
    oThis.deActivateTopicIds = [];
    oThis.endpointTopicsMap = {};
  }

  /**
   * Async perform: Perform webhook creation.
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis.getEndpoint();

    await oThis._segregateEndpointTopics();

    await oThis._createEndpointTopics();

    await oThis._activateEndpointTopics();

    await oThis._deactivateEndpointTopics();

    return responseHelper.successWithData({ endpoint: oThis.endpoint });
  }

  /**
   * Validate params.
   *
   * @sets oThis.eventTopics, oThis.status
   *
   * @returns {Promise<*>}
   */
  async _validateAndSanitizeParams() {
    // Check topics is not an empty array.
    const oThis = this;

    for (let index = 0; index < oThis.eventTopics.length; index++) {
      let eventTopicObj = oThis.eventTopics[index],
        eventTopicKind = eventTopicObj.topic_kind.toLowerCase().trim(),
        kindId = eventTopicObj.kind_id;

      if (!webhookSubscriptionConstants.invertedTopicKinds[eventTopicKind]) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'l_w_as_1',
            api_error_identifier: 'invalid_api_params',
            params_error_identifiers: ['invalid_topics'],
            debug_options: { eventTopics: oThis.eventTopics }
          })
        );
      }
      eventTopicObj.topic_kind = eventTopicKind;
      oThis.endpointTopicsMap[`${eventTopicKind}_${kindId}`] = 1;
    }

    console.log('------------oThis.eventTopics-----', oThis.eventTopics);
    console.log('------------oThis.endpointTopicsMap-----', oThis.endpointTopicsMap);
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
      .where({ uuid: oThis.endpointUuid })
      .fire();

    oThis.endpoint = endpoints[0];

    if (!oThis.endpoint || oThis.endpoint.client_id != oThis.clientId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_w_as_2',
          api_error_identifier: 'invalid endpoint uuid'
        })
      );
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
   * Segregate endpoint topics into create, update, or delete.
   *
   * @returns {Promise}
   * @private
   */
  async _segregateEndpointTopics() {
    const oThis = this;

    const endpointTopics = await new WebhookSubscriptionModel()
      .select('*')
      .where({ w_e_uuid: oThis.endpointUuid })
      .fire();

    for (let index = 0; index < endpointTopics.length; index++) {
      const topicDetails = endpointTopics[index],
        mapKey =
          webhookSubscriptionConstants.topicKinds[topicDetails.topic_kind] + '_' + topicDetails.content_entity_id;

      console.log('------------mapKey-----', mapKey);
      if (
        topicDetails.status == webhookSubscriptionConstants.invertedStatuses[webhookSubscriptionConstants.activeStatus]
      ) {
        if (!oThis.endpointTopicsMap[mapKey]) {
          oThis.deActivateTopicIds.push(topicDetails.id);
        }
      } else if (oThis.endpointTopicsMap[mapKey]) {
        oThis.activateTopicIds.push(topicDetails.id);
      }

      delete oThis.endpointTopicsMap[mapKey];
    }

    console.log('------------oThis.endpointTopicsMap-----', oThis.endpointTopicsMap);
    console.log('------------oThis.deActivateTopicIds-----', oThis.deActivateTopicIds);
    console.log('------------oThis.activateTopicIds-----', oThis.activateTopicIds);
  }

  /**
   * Create endpoint topics.
   *
   * @returns {Promise}
   * @private
   */
  async _createEndpointTopics() {
    const oThis = this;

    const promisesArray = [];

    for (const topicAndId in oThis.endpointTopicsMap) {
      let topicAndIdArr = topicAndId.split('_');
      promisesArray.push(
        new WebhookSubscriptionModel()
          .insert({
            client_id: oThis.clientId,
            w_e_uuid: oThis.endpoint.uuid,
            topic_kind: webhookSubscriptionConstants.invertedTopicKinds[topicAndIdArr[0]],
            content_entity_id: topicAndIdArr[1],
            status: webhookSubscriptionConstants.invertedStatuses[webhookSubscriptionConstants.activeStatus]
          })
          .fire()
      );
    }

    await Promise.all(promisesArray);
  }

  /**
   * Mark webhook endpoint topics active.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _activateEndpointTopics() {
    const oThis = this;

    if (oThis.activateTopicIds.length > 0) {
      await new WebhookSubscriptionModel()
        .update({
          status: webhookSubscriptionConstants.invertedStatuses[webhookSubscriptionConstants.activeStatus]
        })
        .where({ id: oThis.activateTopicIds })
        .fire();
    }
  }

  /**
   * Mark webhook endpoint topics inactive.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deactivateEndpointTopics() {
    const oThis = this;

    if (oThis.deActivateTopicIds.length > 0) {
      await new WebhookSubscriptionModel()
        .update({
          status: webhookSubscriptionConstants.invertedStatuses[webhookSubscriptionConstants.deletedStatus]
        })
        .where({ id: oThis.deActivateTopicIds })
        .fire();
    }
  }
}

module.exports = AddSubscriptionsWebhook;
