const rootPrefix = '../../..',
  CassandraModelBase = require(rootPrefix + '/app/models/cassandra/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  cassandraKeyspaceConstants = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  userNotificationVisitConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotificationVisitDetail');

// Declare variables.
const keyspace = cassandraKeyspaceConstants.cassandraKeyspaceName;

/**
 * Class for user notification visit detail model.
 *
 * @class UserNotificationVisitDetailModel
 */
class UserNotificationVisitDetailModel extends CassandraModelBase {
  /**
   * Constructor for user notification visit detail model.
   *
   * @augments CassandraModelBase
   *
   * @constructor
   */
  constructor() {
    super({ keyspace: keyspace });

    const oThis = this;

    oThis.tableName = 'user_notification_visit_details';
  }

  /**
   * Keys for table user_notification_visit_details.
   *
   * @returns {{partition: string[], sort: string[]}}
   */
  keyObject() {
    return {
      partition: [userNotificationVisitConstants.shortToLongNamesMap.user_id],
      sort: []
    };
  }

  get longToShortNamesMap() {
    return userNotificationVisitConstants.longToShortNamesMap;
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.user_id
   * @param {boolean} dbRow.last_visited_at
   *
   * @returns {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    /* eslint-disable */
    const formattedData = {
      userId: dbRow.user_id ? Number(dbRow.user_id) : undefined,
      lastVisitedAt: dbRow.last_visited_at ? basicHelper.dateToMilliSecondsTimestamp(dbRow.last_visited_at) : undefined
    };
    /* eslint-enable */

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Update user notification visit details.
   *
   * @param {object} queryParams
   * @param {string/number} queryParams.lastVisitedAt
   * @param {string/number} queryParams.userId
   *
   * @returns {Promise<any>}
   */
  async updateLastVisitTime(queryParams) {
    const oThis = this;

    const query = 'update ' + oThis.queryTableName + ' set last_visited_at = ? where user_id = ?;';
    const params = [queryParams.lastVisitedAt, queryParams.userId];

    return oThis.fire(query, params);
  }

  /**
   * Fetch latest last action timestamp
   *
   * @param queryParams
   * @returns {*}
   */
  async fetchLastVisitedAt(queryParams) {
    const oThis = this;

    const query = `select last_visited_at from ${oThis.queryTableName} where user_id = ?;`;
    const params = [queryParams.userId];

    const queryRsp = await oThis.fire(query, params);

    if (queryRsp.rows.length === 0) {
      return {};
    }

    return oThis.formatDbData(queryRsp.rows[0]);
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

module.exports = UserNotificationVisitDetailModel;
