const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/cassandra/Base'),
  cassandraKeyspaceConstants = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

// Declare variables.
const keyspace = cassandraKeyspaceConstants.cassandraKeyspaceName;

/**
 * Class for UserNotification model.
 *
 * @class UserNotificationModel
 */
class UserNotificationModel extends ModelBase {
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

    oThis.tableName = 'user_notifications';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.user_id
   * @param {number} dbRow.last_action_timestamp
   * @param {string} dbRow.uuid
   * @param {number} dbRow.kind
   * @param {string} dbRow.landing_vars
   * @param {number} dbRow.subject_user_id
   * @param {string} dbRow.heading
   * @param {number} dbRow.actor_ids
   * @param {number} dbRow.actor_count
   * @param {string} dbRow.transaction_id
   * @param {number} dbRow.video_id
   * @param {boolean} dbRow.thank_you_flag
   * @param {string} dbRow.thank_you_text
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      userId: dbRow.user_id.toString(10),
      lastActionTimestamp: dbRow.last_action_timestamp,
      uuid: dbRow.uuid,
      kind: dbRow.kind,
      landingVars: dbRow.landing_vars,
      subjectUserId: dbRow.subject_user_id,
      heading: dbRow.heading,
      actorIds: dbRow.actor_ids,
      actorCount: dbRow.actor_count,
      transactionId: dbRow.transaction_id,
      videoId: dbRow.video_id,
      thankYouFlag: dbRow.thank_you_flag,
      thankYouText: dbRow.thank_you_text
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
  static async flushCache(params) {}
}

module.exports = UserNotificationModel;
