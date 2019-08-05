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
   * @param {number} dbRow.id
   * @param {number} dbRow.entity_type
   * @param {string} dbRow.extra_data
   * @param {number} dbRow.status
   * @param {number} dbRow.published_ts
   * @param {number} dbRow.display_ts
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    // const formattedData = {
    //   id: dbRow.id,
    //   entityType: activityConstants.entityTypes[dbRow.entity_type],
    //   entityId: dbRow.entity_id,
    //   extraData: JSON.parse(dbRow.extra_data),
    //   status: activityConstants.statuses[dbRow.status],
    //   publishedTs: dbRow.published_ts,
    //   displayTs: dbRow.display_ts,
    //   createdAt: dbRow.created_at,
    //   updatedAt: dbRow.updated_at
    // };
    //
    // return oThis.sanitizeFormattedData(formattedData);
  }
}

module.exports = UserNotificationModel;
