const rootPrefix = '../../..',
  CassandraModelBase = require(rootPrefix + '/app/models/cassandra/Base'),
  ParametersFormatter = require(rootPrefix + '/lib/notification/formatter/ParametersFormatter'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  cassandraKeyspaceConstants = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  userActionDetailConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userActionDetail');

// Declare variables.
const keyspace = cassandraKeyspaceConstants.cassandraKeyspaceName;

/**
 * Class for user action details model.
 *
 * @class UserActionDetailModel
 */
class UserActionDetailModel extends CassandraModelBase {
  /**
   * Constructor for user notification model.
   *
   * @augments CassandraModelBase
   *
   * @constructor
   */
  constructor() {
    super({ keyspace: keyspace });

    const oThis = this;

    oThis.tableName = 'user_action_details';
  }

  /**
   * Keys for table user_notifications
   *
   * @returns {{partition: string[], sort: string[]}}
   */
  keyObject() {
    const namesMap = userActionDetailConstants.shortToLongNamesMap;

    return {
      partition: [namesMap.user_id],
      sort: [namesMap.entity_identifier]
    };
  }

  get longToShortNamesMap() {
    return userActionDetailConstants.longToShortNamesMap;
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   *
   * @returns {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const namesMap = userActionDetailConstants.shortToLongNamesMap;

    const formattedDbRow = {};

    for (let shortKey in dbRow) {
      let key = namesMap[shortKey];
      formattedDbRow[key] = dbRow[shortKey];
    }

    /* eslint-disable */
    const formattedData = {
      userId: formattedDbRow.userId ? Number(formattedDbRow.userId) : undefined,

      entityIdentifier: formattedDbRow.entityIdentifier ? formattedDbRow.entityIdentifier : undefined,

      lastReplyTimestamp: formattedDbRow.lastReplyTimestamp
        ? basicHelper.dateToMilliSecondsTimestamp(formattedDbRow.lastReplyTimestamp)
        : undefined,

      lastReplyContributionTimestamp: formattedDbRow.lastReplyContributionTimestamp
        ? basicHelper.dateToMilliSecondsTimestamp(formattedDbRow.lastReplyContributionTimestamp)
        : undefined,

      lastVideoContributionTimestamp: formattedDbRow.lastVideoContributionTimestamp
        ? basicHelper.dateToMilliSecondsTimestamp(formattedDbRow.lastVideoContributionTimestamp)
        : undefined,

      userContributionTimestamp: formattedDbRow.userContributionTimestamp
        ? basicHelper.dateToMilliSecondsTimestamp(formattedDbRow.userContributionTimestamp)
        : undefined
    };
    /* eslint-enable */

    return oThis.sanitizeFormattedData(formattedData);
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

module.exports = UserActionDetailModel;
