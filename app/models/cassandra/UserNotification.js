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
