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
   * @param {string} dbRow.device_kind
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
    return ['id', 'userId', 'deviceId', 'deviceToken', 'deviceKind', 'createdAt', 'updatedAt'];
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

    const dbRows = await oThis
      .select('*')
      .where({ user_id: userIds })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.userId] = formatDbRow;
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
    const UserDeviceByUserIds = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceByUserIds');

    await new UserDeviceByUserIds({ userIds: [params.userId] }).clear();
  }
}

module.exports = UserDevice;
