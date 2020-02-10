const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  socketConnectionConstants = require(rootPrefix + '/lib/globalConstant/socket/socketConnection');

// Declare variables.
const dbName = databaseConstants.socketDbName;

/**
 * Class for user socket connection details model.
 *
 * @class UserSocketConnectionDetailsModel
 */
class UserSocketConnectionDetailsModel extends ModelBase {
  /**
   * Constructor for user socket connection details model.
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
   * @param {number} dbRow.socket_identifier
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
      socketIdentifier: dbRow.socket_identifier,
      authKeyExpiryAt: dbRow.auth_key_expiry_at,
      status: socketConnectionConstants.statuses[dbRow.status],
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
    return ['id', 'userId', 'authKey', 'socketServerId', 'authKeyExpiryAt', 'status', 'createdAt', 'updatedAt'];
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
   * Fetch user socket connection details object for given userIds.
   *
   * @param {array<string>} userIds: user ids
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
   * Fetch active user socket connection details object for given userIds.
   *
   * @param {array<string>} userIds: user ids
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
        socketConnectionConstants.invertedStatuses[socketConnectionConstants.connectedStatus]
      ])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.userId] = formatDbRow;
    }

    return response;
  }

  /**
   * Mark socket connection details as expired.
   *
   * @param {array<number>} userSocketConnDetailsIds
   * @param {array<number>} userIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markSocketConnectionDetailsAsExpired(userSocketConnDetailsIds, userIds) {
    const oThis = this;

    await oThis
      .update({
        status: socketConnectionConstants.invertedStatuses[socketConnectionConstants.expiredStatus]
      })
      .where({
        id: userSocketConnDetailsIds
      })
      .fire();

    await UserSocketConnectionDetailsModel.flushCache({ userIds: userIds });
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {array<number>} params.userIds
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const UserSocketConnectionDetailsCache = require(rootPrefix +
      '/lib/cacheManagement/multi/UserSocketConDetailsByUserIds');

    await new UserSocketConnectionDetailsCache({ userIds: params.userIds }).clear();
  }
}

module.exports = UserSocketConnectionDetailsModel;
