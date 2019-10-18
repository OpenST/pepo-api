const rootPrefix = '../../..',
  CassandraModelBase = require(rootPrefix + '/app/models/cassandra/Base'),
  cassandraKeyspaceConstants = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  userPersonalizedDataConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userPersonalizedData');

// Declare variables.
const keyspace = cassandraKeyspaceConstants.cassandraKeyspaceName;

/**
 * Class for User Personalized Data model.
 *
 * @class UserPersonalizedDataModel
 */
class UserPersonalizedDataModel extends CassandraModelBase {
  /**
   * Constructor for user personalized data model.
   *
   * @augments CassandraModelBase
   *
   * @constructor
   */
  constructor() {
    super({ keyspace: keyspace });

    const oThis = this;

    oThis.tableName = 'user_personalized_data';
  }

  /**
   * Keys for table user_notification_visit_details.
   *
   * @returns {{partition: string[], sort: string[]}}
   */
  keyObject() {
    return {
      partition: [
        userPersonalizedDataConstants.shortToLongNamesMap.user_id,
        userPersonalizedDataConstants.shortToLongNamesMap.kind
      ],
      sort: []
    };
  }

  get longToShortNamesMap() {
    return userPersonalizedDataConstants.longToShortNamesMap;
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.user_id
   * @param {number} dbRow.kind
   * @param {number} dbRow.json_data
   *
   * @returns {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    /* eslint-disable */
    const formattedData = {
      userId: dbRow.user_id ? Number(dbRow.user_id) : undefined,
      kind: dbRow.kind ? userPersonalizedDataConstants.kinds[dbRow.kind] : undefined,
      uniqueId: dbRow.unique_id ? dbRow.unique_id : undefined,
      jsonData: dbRow.json_data ? JSON.parse(dbRow.json_data) : undefined
    };
    /* eslint-enable */

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Update json data for users.
   *
   * @param {object} queryParams
   * @param {number} queryParams.userId
   * @param {number} queryParams.kind
   * @param {number} queryParams.jsonData
   * @param {number} queryParams.uniqueId
   *
   * @returns {Promise<any>}
   */
  async updateJsonDataForUsers(queryParams) {
    const oThis = this;

    const query =
      'update ' + oThis.queryTableName + ' set json_data = ? where user_id = ? and kind = ? and unique_id = ?;';
    const queries = [];

    let kindInt = userPersonalizedDataConstants.invertedKinds[queryParams.kind];

    for (let i = 0; i < queryParams.videoIds.length; i++) {
      const updateParam = [JSON.stringify(queryParams.jsonData), queryParams.userId, kindInt, queryParams.uniqueId];
      queries.push({ query: query, params: updateParam });
    }

    return oThis.batchFire(queries);
  }

  /**
   * Fetch rows for a user and kind
   *
   * @param {object} queryParams
   * @param {number} queryParams.userId
   * @param {number} queryParams.kind
   * @param {number} queryParams.uniqueId
   *
   * @returns {*}
   */
  async fetchJsonDataForKind(queryParams) {
    const oThis = this;

    let kindInt = userPersonalizedDataConstants.invertedKinds[queryParams.kind];

    const query = `select json_data, kind from ${
      oThis.queryTableName
    } where user_id = ? and kind = ? and unique_id = ?;`;
    const params = [queryParams.userId, kindInt, queryParams.uniqueId];

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

module.exports = UserPersonalizedDataModel;
