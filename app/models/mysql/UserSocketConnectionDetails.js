const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  socketConnectionConstants = require(rootPrefix + '/lib/globalConstant/socketConnection');

// Declare variables.
const dbName = databaseConstants.socketDbName;

/**
 * Class for UserSocketConnectionDetails model.
 *
 * @class UserSocketConnectionDetails
 */
class UserSocketConnectionDetails extends ModelBase {
  /**
   * Constructor for UserSocketConnectionDetails model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_socket_connection_details';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.user_id
   * @param {number} dbRow.auth_key
   * @param {number} dbRow.auth_key_expiry_at
   * @param {number} dbRow.status
   * @param {number} dbRow.socket_server_id
   * @param {number} dbRow.socket_expiry_at
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      userId: dbRow.user_id,
      authKey: dbRow.auth_key,
      socketServerId: dbRow.socket_server_id,
      authKeyExpiryAt: dbRow.auth_key_expiry_at,
      status: socketConnectionConstants.statuses[dbRow.status],
      socketExpiryAt: dbRow.socket_expiry_at,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return [
      'id',
      'userId',
      'authKey',
      'socketServerId',
      'authKeyExpiryAt',
      'status',
      'socketExpiryAt',
      'createdAt',
      'updatedAt'
    ];
  }

  /**
   * Fetch user socket connection details object for user id.
   *
   * @param {string} userId: user id
   *
   * @return {object}
   */
  async fetchByUserId(userId) {
    const oThis = this;

    const dbRows = await oThis.fetchByUserIds([userId]);

    return dbRows[userId] || {};
  }

  /**
   * Fetch user socket connection details object for given user_ids.
   *
   * @param {array} userIds: user ids
   *
   * @return {object}
   */
  async fetchByUserIds(userIds) {
    const oThis = this;

    const response = {};

    const dbRows = await oThis
      .select('*')
      .where(['user_id IN (?)', userIds])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.userId] = formatDbRow;
    }

    return response;
  }

  /**
   * Fetch active user socket connection details object for given user_ids.
   *
   * @param {array} userIds: user ids
   *
   * @return {object}
   */
  async fetchActiveByUserIds(userIds) {
    const oThis = this;

    const response = {};

    const dbRows = await oThis
      .select('*')
      .where([
        'user_id IN (?) AND status = ?',
        userIds,
        socketConnectionConstants.invertedStatuses[socketConnectionConstants.connected]
      ])
      .fire();

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
    const UserSocketConnectionDetailsCache = require(rootPrefix +
      '/lib/cacheManagement/multi/UserSocketConDetailsByUserIds');

    await new UserSocketConnectionDetailsCache({ userIds: [params.userId] }).clear();
  }
}

module.exports = UserSocketConnectionDetails;
