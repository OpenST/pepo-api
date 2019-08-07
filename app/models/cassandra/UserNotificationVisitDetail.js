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
   * Fetch user notifications for given user ids
   *
   * @param {array} userIds: user ids
   *
   * @return {object}
   */
  async fetchByUserIds(userIds) {
    const oThis = this;

    const response = {};
    let query = `select * from ${keyspace}.${oThis.tableName} where user_id in ?;`;
    let params = [userIds];
    const queryRsp = await oThis.fire(query, params);

    const dbRows = queryRsp.rows;

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.userId] = formatDbRow;
    }

    return response;
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
