const rootPrefix = '../../..',
  CassandraModelBase = require(rootPrefix + '/app/models/cassandra/Base'),
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
      partition: [namesMap.u_id],
      sort: [namesMap.e_i]
    };
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

    if (formattedData.entityIdentifier) {
      let data = formattedData.entityIdentifier.split('_');
      formattedData.entityKind = userActionDetailConstants.shortToLongNamesMapForEntityKind[data[0]];
      formattedData.entityId = data[1];
    }
    /* eslint-enable */

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Update user notification visit details.
   *
   * @param {object} queryParams
   * @param {string} queryParams.entityKind
   * @param {number} queryParams.entityId
   * @param {string/number} queryParams.userId
   * @param {object} queryParams.updateParams
   *
   * @returns {Promise<any>}
   */
  async updateRow(queryParams) {
    const oThis = this;
    const longToShortnamesMap = userActionDetailConstants.longToShortNamesMap;

    const entityIdentifier = userActionDetailConstants.createEntityIdentifier(
      queryParams.entityKind,
      queryParams.entityId
    );

    let queryString = 'update ' + oThis.queryTableName + ' set ';

    const valuesArray = [];
    let isFirstParameter = true;

    for (const key in queryParams.updateParams) {
      const val = queryParams.updateParams[key];

      // to avoid extra loop, join was not used here.
      if (!isFirstParameter) {
        queryString += ', ';
      } else {
        isFirstParameter = false;
      }

      queryString += `${longToShortnamesMap[key]}=? `;
      valuesArray.push(val);
    }

    queryString += `where ${longToShortnamesMap['userId']} = ? and ${longToShortnamesMap['entityIdentifier']} = ?;`;
    valuesArray.push(queryParams.userId);
    valuesArray.push(entityIdentifier);

    await oThis.fire(queryString, valuesArray);

    const flushCacheParams = {
      userId: queryParams.userId,
      entityIdentifiers: [entityIdentifier]
    };

    return UserActionDetailModel.flushCache(flushCacheParams);
  }

  /**
   * Fetch user notifications
   *
   * @param {object} queryParams: queryParams
   *
   * @return {object}
   */
  async fetchUserActionDetails(userId, entityIdentifiers) {
    const oThis = this;

    const longToShortnamesMap = userActionDetailConstants.longToShortNamesMap,
      userIdKey = longToShortnamesMap['userId'],
      entityIdentifierKey = longToShortnamesMap['entityIdentifier'];

    const query = `select * from ${oThis.queryTableName} where ${userIdKey} = ? and ${entityIdentifierKey} in ?;`;

    const params = [userId, entityIdentifiers];

    const queryRsp = await oThis.fire(query, params);

    const response = {};

    for (let index = 0; index < queryRsp.rows.length; index++) {
      const formattedData = oThis.formatDbData(queryRsp.rows[index]);
      response[formattedData.entityIdentifier] = formattedData;
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    if (params.userId && params.entityIdentifiers) {
      const UserActionDetailsByUserIdsCache = require(rootPrefix +
        '/lib/cacheManagement/multi/UserActionDetailsByUserIds');

      await new UserActionDetailsByUserIdsCache({
        userId: params.userId,
        entityIdentifiers: params.entityIdentifiers
      }).clear();
    }
  }
}

module.exports = UserActionDetailModel;
