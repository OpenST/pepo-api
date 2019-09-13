const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  aggregatedNotificationsConstants = require(rootPrefix + '/lib/globalConstant/aggregatedNotifications'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.bigDbName;

/**
 * Class for user device model.
 *
 * @class AggregatedNotification
 */
class AggregatedNotification extends ModelBase {
  /**
   * Constructor for user device model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'aggregated_notifications';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.user_id
   * @param {number} dbRow.send_time
   * @param {string} dbRow.extra_data
   * @param {string} dbRow.status
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      userId: dbRow.user_id,
      sendTime: dbRow.send_time,
      extraData: JSON.parse(dbRow.extra_data),
      status: aggregatedNotificationsConstants.statuses[dbRow.status],
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
    return ['id', 'userId', 'sendTime', 'extraData', 'status', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch details.
   *
   * @param {Object} params
   * @param {Array} params.sendTime
   *
   * @returns {Promise<void>}
   */
  async fetchPendingBySendTime(params) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where([
        'send_time <= ? AND status = ?',
        params.sendTime,
        aggregatedNotificationsConstants.invertedStatuses[aggregatedNotificationsConstants.pendingStatus]
      ])
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.userId] = formatDbRow;
    }

    return response;
  }

  /**
   * Index name
   *
   * @returns {string}
   */
  static get aggregatedNotificationsUniqueIndexName() {
    return 'user_id';
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {}
}

module.exports = AggregatedNotification;
