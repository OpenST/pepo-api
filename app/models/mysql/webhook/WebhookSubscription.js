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
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.client_id
   * @param {string} dbRow.w_e_uuid
   * @param {number} dbRow.topic_kind
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
      topicKind: webhookSubscriptionConstants.topicKinds[dbRow.topic_kind],
      contentEntityId: dbRow.content_entity_id,
      status: webhookSubscriptionConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return [
      'id',
      'clientId',
      'webhookEndpointUuid',
      'topicKind',
      'contentEntityId',
      'status',
      'createdAt',
      'updatedAt'
    ];
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
