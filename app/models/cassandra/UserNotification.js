const rootPrefix = '../../..',
  CassandraModelBase = require(rootPrefix + '/app/models/cassandra/Base'),
  ParametersFormatter = require(rootPrefix + '/lib/notification/formatter/ParametersFormatter'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  cassandraKeyspaceConstants = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

// Declare variables.
const keyspace = cassandraKeyspaceConstants.cassandraKeyspaceName;

/**
 * Class for user notification model.
 *
 * @class UserNotificationModel
 */
class UserNotificationModel extends CassandraModelBase {
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

    oThis.tableName = 'user_notifications';
  }

  /**
   * Fetch by creator user id.
   *
   * @param {integer} params.limit: no of rows to fetch
   * @param {integer} params.userId: creator user id
   * @param {integer} params.lastActionTimestamp: creator user id
   * @param {string} params.pageState: cassandra page state
   *
   * @returns {Promise<object>}
   */
  async fetchPaginatedForUserId(params) {
    const oThis = this;

    const limit = params.limit,
      userId = params.userId,
      pageState = params.pageState;

    const userIdKey = ParametersFormatter.getColumnNameForQuery('userId');
    const valuesArray = [userId];

    const queryString = `select * from ${oThis.queryTableName} where ${userIdKey}=?`;

    const options = {
      prepare: true,
      fetchSize: limit,
      pageState: pageState
    };

    const resp = await oThis.eachRow(queryString, valuesArray, options, null, null);

    const dbRows = resp.rows;

    const response = [];

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response.push(formatDbRow);
    }

    return { userNotifications: response, pageState: resp.pageState };
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.user_id
   * @param {number/string} dbRow.last_action_timestamp
   * @param {string} dbRow.uuid
   * @param {number} dbRow.kind
   * @param {number} dbRow.subject_user_id
   * @param {number} dbRow.actor_ids
   * @param {number} dbRow.actor_count
   * @param {string} dbRow.payload
   * @param {number} dbRow.heading_version
   * @param {string} dbRow.column1
   * @param {string} dbRow.column2
   * @param {number} dbRow.flag1
   * @param {number} dbRow.flag2
   *
   * @returns {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    /* eslint-disable */
    const formattedData = {
      user_id: dbRow.user_id ? Number(dbRow.user_id) : undefined,
      last_action_timestamp: dbRow.last_action_timestamp
        ? basicHelper.dateToMilliSecondsTimestamp(dbRow.last_action_timestamp)
        : undefined,
      uuid: dbRow.uuid,
      kind: dbRow.kind ? userNotificationConstants.kinds[dbRow.kind] : undefined,
      subject_user_id: dbRow.subject_user_id ? Number(dbRow.subject_user_id) : undefined,
      actor_ids: dbRow.actor_ids ? [...dbRow.actor_ids] : undefined,
      actor_count: dbRow.actor_count,
      payload: dbRow.payload ? JSON.parse(dbRow.payload) : undefined,
      headingVersion: dbRow.heading_version,
      column1: dbRow.column1,
      column2: dbRow.column2,
      flag1: dbRow.flag1,
      flag2: dbRow.flag2
    };
    /* eslint-enable */

    const sanitizedFormattedData = oThis.sanitizeFormattedData(formattedData);

    return ParametersFormatter.formatDbData(sanitizedFormattedData);
  }

  /**
   * Insert entry in user_notifications table.
   *
   * @param {object} insertParameters
   *
   * @returns {Promise<void>}
   */
  async insert(insertParameters) {
    const oThis = this;

    const { queryString, valuesArray } = oThis.createInsertQueryString(insertParameters);

    await oThis.fire(queryString, valuesArray);
  }

  /**
   * Create insert query and parameters for model.
   *
   * @param {object} insertParameters
   * @param {number/string} insertParameters.user_id
   * @param {string} insertParameters.last_action_timestamp
   * @param {number/string} insertParameters.kind
   * @param {number/string} insertParameters.subject_user_id
   * @param {number/string} insertParameters.actor_count
   * @param {number/string} insertParameters.heading_version
   * @param {number/string} insertParameters.flag_1
   * @param {number/string} insertParameters.flag_1
   * @param {string} insertParameters.uuid
   * @param {array<string/number>} insertParameters.actor_ids
   * @param {array<string/number>} insertParameters.actor_ids
   * @param {object} insertParameters.payload
   * @param {object} insertParameters.column_1
   * @param {object} insertParameters.column_2
   *
   * @returns {{valuesArray: [], queryString: {string}}}
   */
  createInsertQueryString(insertParameters) {
    const oThis = this;
    let queryString = `insert into ${oThis.queryTableName} (`,
      valueString = 'values (';

    const valuesArray = [];
    let isFirstParameter = true;

    for (const key in insertParameters) {
      if (isFirstParameter) {
        isFirstParameter = false;
      } else {
        queryString += ', ';
        valueString += ', ';
      }

      const formattedValue = oThis.formatParameters(key, insertParameters[key]);
      valuesArray.push(formattedValue);
      queryString += key;
      valueString += '?';
    }
    valueString += ')';
    queryString += `) ${valueString}`;

    return { queryString, valuesArray };
  }

  /**
   * Fetch latest last action timestamp
   *
   * @param queryParams
   * @returns {*}
   */
  async fetchLatestLastActionTime(queryParams) {
    const oThis = this;

    const lastActionTimestampKey = ParametersFormatter.getColumnNameForQuery('lastActionTimestamp'),
      userIdKey = ParametersFormatter.getColumnNameForQuery('userId');

    const query = `select ${lastActionTimestampKey} from ${oThis.queryTableName} 
      where ${userIdKey} = ? order by ${lastActionTimestampKey} desc limit 1;`;
    const params = [queryParams.userId];

    const queryRsp = await oThis.fire(query, params);

    if (queryRsp.rows.length === 0) {
      return {};
    }

    return oThis.formatDbData(queryRsp.rows[0]);
  }

  /**
   * Fetch user notifications
   *
   * @param {object} queryParams: queryParams
   *
   * @return {object}
   */
  async fetchUserNotification(queryParams) {
    const oThis = this;
    const lastActionTimestampKey = ParametersFormatter.getColumnNameForQuery('lastActionTimestamp'),
      userIdKey = ParametersFormatter.getColumnNameForQuery('userId'),
      uuidKey = ParametersFormatter.getColumnNameForQuery('uuid');

    const query = `select * from ${
      oThis.queryTableName
    } where ${userIdKey} = ? and ${lastActionTimestampKey} = ? and ${uuidKey} = ?;`;
    const params = [queryParams.user_id, queryParams.last_action_timestamp, queryParams.uuid];
    const queryRsp = await oThis.fire(query, params);

    const dbRows = queryRsp.rows;

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /**
   * Update user notification thank you flag.
   *
   * @param {object} queryParams
   * @param {number} queryParams.thankYouFlag
   * @param {number} queryParams.userId
   * @param {number} queryParams.lastActionTimestamp
   * @param {string} queryParams.uuid
   * @param {string} queryParams.kind
   *
   * @returns {Promise<any>}
   */
  async updateThankYouFlag(queryParams) {
    const oThis = this;

    const kind = queryParams.kind;
    const lastActionTimestampKey = ParametersFormatter.getColumnNameForQuery('lastActionTimestamp', kind),
      userIdKey = ParametersFormatter.getColumnNameForQuery('userId', kind),
      uuidKey = ParametersFormatter.getColumnNameForQuery('uuid', kind),
      thankYouFlagKey = ParametersFormatter.getColumnNameForQuery('thankYouFlag', kind);

    const query = `update ${
      oThis.queryTableName
    } set ${thankYouFlagKey} = ? where ${userIdKey} = ? and ${lastActionTimestampKey} = ? and ${uuidKey} = ?;`;
    const params = [queryParams.thankYouFlag, queryParams.userId, queryParams.lastActionTimestamp, queryParams.uuid];

    return oThis.fire(query, params);
  }

  /**
   * Format parameters for insertion.
   *
   * @param {string} key
   * @param {string/number/object/set/array} value
   *
   * @returns {string|Set<unknown>|number|*}
   */
  formatParameters(key, value) {
    switch (key) {
      case 'user_id':
      case 'last_action_timestamp':
      case 'subject_user_id':
      case 'actor_count':
      case 'heading_version':
      case 'flag1':
      case 'flag2': {
        return Number(value);
      }
      case 'uuid': {
        return value.toString();
      }
      case 'kind': {
        return Number(userNotificationConstants.invertedKinds[value]);
      }
      case 'actor_ids': {
        return new Set(value);
      }
      case 'payload': {
        return JSON.stringify(value);
      }
      case 'column1':
      case 'column2': {
        return value.toString();
      }
      default: {
        throw new Error(`Invalid key name.- ${key}`);
      }
    }
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
    const promisesArray = [];

    if (params.userId) {
      const UserNotificationsByUserIdPagination = require(rootPrefix +
        '/lib/cacheManagement/single/UserNotificationsByUserIdPagination');
      promisesArray.push(new UserNotificationsByUserIdPagination({ userId: [params.userId] }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = UserNotificationModel;
