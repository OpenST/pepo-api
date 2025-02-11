const rootPrefix = '../../..',
  CassandraModelBase = require(rootPrefix + '/app/models/cassandra/Base'),
  cassandraKeyspaceConstants = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  userNotificationCountConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotificationCount');

// Declare variables.
const keyspace = cassandraKeyspaceConstants.cassandraKeyspaceName;

/**
 * Class for user notification count model.
 *
 * @class UserNotificationCountModel
 */
class UserNotificationCountModel extends CassandraModelBase {
  /**
   * Constructor for user notification visit count model.
   *
   * @augments CassandraModelBase
   *
   * @constructor
   */
  constructor() {
    super({ keyspace: keyspace });

    const oThis = this;

    oThis.tableName = 'user_notification_count';
  }

  /**
   * Keys for table user_notification_visit_details.
   *
   * @returns {{partition: string[], sort: string[]}}
   */
  keyObject() {
    return {
      partition: [userNotificationCountConstants.shortToLongNamesMap.user_id],
      sort: []
    };
  }

  get longToShortNamesMap() {
    return userNotificationCountConstants.longToShortNamesMap;
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.user_id
   * @param {number} dbRow.unread_notification_count
   *
   * @returns {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    /* eslint-disable */
    const formattedData = {
      userId: dbRow.user_id ? Number(dbRow.user_id) : undefined,
      unreadNotificationCount: dbRow.unread_notification_count ? Number(dbRow.unread_notification_count) : undefined
    };
    /* eslint-enable */

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Increment user notification count by 1.
   *
   * @param {object} queryParams
   * @param {array<string/number>} queryParams.userIds
   *
   * @returns {Promise<any>}
   */
  async incrementUnreadNotificationCount(queryParams) {
    const oThis = this;

    const query =
      'UPDATE ' +
      oThis.queryTableName +
      ' SET unread_notification_count = unread_notification_count + 1 WHERE user_id in ?;';
    const params = [queryParams.userIds];

    return oThis.fire(query, params);
  }

  /**
   * Reset(delete) user notification count for user_id.
   *
   * @param {object} queryParams
   * @param {string/number} queryParams.userId
   * @param {string/number} queryParams.count
   *
   * @returns {Promise<any>}
   */
  async resetUnreadNotificationCount(queryParams) {
    const oThis = this;

    const query =
      'UPDATE ' +
      oThis.queryTableName +
      ' SET unread_notification_count = unread_notification_count - ? WHERE user_id = ?;';
    const params = [queryParams.count, queryParams.userId];

    return oThis.fire(query, params);
  }

  /**
   * Fetch unread notification count.
   *
   * @param {object} queryParams
   * @param {array<number>} queryParams.userIds
   *
   * @returns {*}
   */
  async fetchUnreadNotificationCount(queryParams) {
    const oThis = this;

    const userIds = queryParams.userIds;

    const query = `SELECT user_id, unread_notification_count FROM ${oThis.queryTableName} WHERE user_id IN ?;`;
    const params = [userIds];

    const queryRsp = await oThis.fire(query, params),
      response = {};

    if (queryRsp.rows.length === 0) {
      return {};
    }

    for (let index = 0; index < queryRsp.rows.length; index++) {
      const formattedData = oThis.formatDbData(queryRsp.rows[index]);
      response[formattedData.userId] = formattedData.unreadNotificationCount;
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

module.exports = UserNotificationCountModel;
