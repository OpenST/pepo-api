const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/cassandra/Base'),
  cassandraClient = require(rootPrefix + '/lib/cassandraWrapper'),
  cassandraKeyspaceConstants = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  userNotificationVisitDetailConstants = require(rootPrefix +
    '/lib/globalConstant/cassandra/userNotificationVisitDetail');

// Declare variables.
const keyspace = cassandraKeyspaceConstants.cassandraKeyspaceName;

/**
 * Class for UserNotificationVisitDetail model.
 *
 * @class UserNotificationVisitDetailModel
 */
class UserNotificationVisitDetailModel extends ModelBase {
  /**
   * Constructor for activity model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ keyspace: keyspace });

    const oThis = this;

    oThis.tableName = 'user_notification_visit_details';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.user_id
   * @param {boolean} dbRow.unread_flag
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      userId: dbRow.user_id.toString(10),
      unreadFlag: dbRow.unread_flag
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Update user notification visit details
   *
   * @param queryParams
   * @returns {Promise<any>}
   */
  async updateLastVisitTime(queryParams) {
    const oThis = this;
    let query = 'update ' + oThis.queryTableName + ' set last_visited_at = ? where user_id = ?;';
    let params = [queryParams.lastVisitedAt, queryParams.userId];
    return oThis.fire(query, params);
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.userId
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    // Do nothing.
  }
}

module.exports = UserNotificationVisitDetailModel;
