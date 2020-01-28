const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  webhookEventConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEvent');

// Declare variables names.
const dbName = databaseConstants.webhookDbName;

/**
 * Class for webhook event model.
 *
 * @class WebhookEventModel
 */
class WebhookEventModel extends ModelBase {
  /**
   * Constructor for webhook event model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'webhook_events';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.client_id
   * @param {string} dbRow.w_e_uuid
   * @param {string} dbRow.uuid
   * @param {number} dbRow.topic_kind
   * @param {string} dbRow.extra_data
   * @param {number} dbRow.status
   * @param {number} dbRow.execute_at
   * @param {number} dbRow.retry_count
   * @param {string} dbRow.internal_error_count
   * @param {string} dbRow.lock_id
   * @param {string} dbRow.error_response
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
      uuid: dbRow.uuid,
      topicKind: webhookEventConstants.topicKinds[dbRow.topic_kind],
      extraData: dbRow.extra_data ? JSON.parse(dbRow.extra_data) : undefined,
      status: webhookEventConstants.statuses[dbRow.status],
      executeAt: dbRow.execute_at,
      retryCount: dbRow.retry_count,
      internalErrorCount: dbRow.internal_error_count,
      lockId: dbRow.lock_id,
      errorResponse: dbRow.error_response,
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
      'uuid',
      'webhookEndpointUuid',
      'topicKind',
      'extraData',
      'status',
      'executeAt',
      'retryCount',
      'internalErrorCount',
      'lockId',
      'errorResponse',
      'createdAt',
      'updatedAt'
    ];
  }

  /**
   * Get rows to be processed and locked by lockId.
   *
   * @param {object} params
   * @param {string} params.lockId
   *
   * @returns {Promise<*>}
   */
  async getLockedRows(params) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({
        lock_id: params.lockId,
        status: webhookEventConstants.invertedStatuses[webhookEventConstants.inProgressStatus]
      })
      .fire();

    const response = [];

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response.push(formatDbRow);
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

module.exports = WebhookEventModel;
