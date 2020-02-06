const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  aggregatedNotificationsConstants = require(rootPrefix + '/lib/globalConstant/big/aggregatedNotifications');

// Declare variables.
const dbName = databaseConstants.bigDbName;

/**
 * Class for aggregated notification model.
 *
 * @class AggregatedNotificationModel
 */
class AggregatedNotificationModel extends ModelBase {
  /**
   * Constructor for aggregated notification model.
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
   * @param {object} params
   * @param {number} params.sendTime
   * @param {number} [params.page]
   * @param {number} [params.limit]
   *
   * @returns {Promise<void>}
   */
  async fetchPendingBySendTime(params) {
    const oThis = this;

    const sendTime = params.sendTime,
      page = params.page || 1,
      limit = params.limit || 50,
      offset = (page - 1) * limit;

    const dbRows = await oThis
      .select('*')
      .where([
        'send_time <= ? AND status = ?',
        sendTime,
        aggregatedNotificationsConstants.invertedStatuses[aggregatedNotificationsConstants.pendingStatus]
      ])
      .limit(limit)
      .offset(offset)
      .order_by('send_time ASC')
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.userId] = formatDbRow;
    }

    return response;
  }

  /**
   * Index name.
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
  static async flushCache() {
    // Do nothing.
  }
}

module.exports = AggregatedNotificationModel;
