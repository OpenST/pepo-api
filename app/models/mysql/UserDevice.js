const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  userDevicesConstants = require(rootPrefix + '/lib/globalConstant/userDevice'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.userDbName;

/**
 * Class for user device model.
 *
 * @class UserDevice
 */
class UserDevice extends ModelBase {
  /**
   * Constructor for user device model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_devices';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.user_id
   * @param {number} dbRow.device_id
   * @param {string} dbRow.device_token
   * @param {string} dbRow.user_timezone
   * @param {string} dbRow.device_kind
   * @param {string} dbRow.status
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
      deviceId: dbRow.device_id,
      deviceToken: dbRow.device_token,
      deviceKind: userDevicesConstants.userDeviceKinds[dbRow.device_kind],
      status: userDevicesConstants.statuses[dbRow.status],
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
    return ['id', 'userId', 'deviceId', 'deviceToken', 'deviceKind', 'status', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch user devices by user ids.
   *
   * @param {array} userIds
   *
   * @returns {Promise<void>}
   */
  async fetchByUserIds(userIds) {
    const oThis = this;

    const whereClause = [
        'user_id IN (?) AND status = ?',
        userIds,
        userDevicesConstants.invertedStatuses[userDevicesConstants.activeStatus]
      ],
      dbRows = await oThis
        .select('id, user_id')
        .where(whereClause)
        .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);

      response[formatDbRow.userId] = response[formatDbRow.userId] || [];
      response[formatDbRow.userId].push(formatDbRow.id);
    }

    return response;
  }

  /**
   * Fetch user devices by ids.
   *
   * @param {array} ids
   *
   * @returns {Promise<void>}
   */
  async fetchByIds(ids) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ id: ids })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Index name
   *
   * @returns {string}
   */
  static get userDeviceUniqueIndexName() {
    return 'uidx_1';
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    const UserDeviceIdsByUserIds = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceIdsByUserIds');
    promisesArray.push(new UserDeviceIdsByUserIds({ userIds: [params.userId] }).clear());

    const UserDeviceByIds = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceByIds');
    promisesArray.push(new UserDeviceByIds({ ids: [params.id] }).clear());

    await Promise.all(promisesArray);
  }
}

module.exports = UserDevice;
