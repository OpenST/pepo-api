const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  webhookSubscriptionConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookSubscription');

// Declare variables names.
const dbName = databaseConstants.webhookDbName;

/**
 * Class for webhook subscriptions model.
 *
 * @class WebhookSubscriptionModel
 */
class WebhookSubscriptionModel extends ModelBase {
  /**
   * Constructor for webhook subscriptions model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'webhook_subscriptions';
  }

  /**
   * Bitwise config.
   *
   * @return {object}
   */
  get bitwiseConfig() {
    return {
      topicKinds: webhookSubscriptionConstants.topicKinds
    };
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.client_id
   * @param {string} dbRow.w_e_uuid
   * @param {number} dbRow.topic_kinds
   * @param {number} dbRow.content_entity_id
   * @param {number} dbRow.status
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @returns {{}}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      clientId: dbRow.client_id,
      webhookEndpointUuid: dbRow.w_e_uuid,
      topicKinds: dbRow.topic_kinds,
      contentEntityId: dbRow.content_entity_id,
      status: webhookSubscriptionConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List Of formatted column names that can be exposed by service.
   *
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return [
      'id',
      'clientId',
      'webhookEndpointUuid',
      'topicKinds',
      'contentEntityId',
      'status',
      'createdAt',
      'updatedAt'
    ];
  }

  /**
   * Get rows by topicKind and contentEntityIds.
   *
   * @param {object} params
   * @param {Integer} params.contentEntityIds
   * @param {Array} params.topicKind
   *
   * @returns {Promise<*>}
   */
  async getByKindAndContentEntityIds(params) {
    const oThis = this;
    const topicKindVal = webhookSubscriptionConstants.invertedTopicKinds[params.topicKind];

    const dbRows = await oThis
      .select('*')
      .where({ content_entity_id: params.contentEntityIds })
      .where(['topic_kinds = topic_kinds | ?', topicKindVal])
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.contentEntityId] = formatDbRow;
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<*>}
   */
  static async flushCache() {
    // Do nothing.
  }
}

module.exports = WebhookSubscriptionModel;
