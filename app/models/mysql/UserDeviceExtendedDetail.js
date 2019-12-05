const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  userDeviceExtendedDetailConstants = require(rootPrefix + '/lib/globalConstant/userDeviceExtendedDetail');

// Declare variables.
const dbName = databaseConstants.userDbName;

/**
 * Class for user device extended detail model.
 *
 * @class UserDeviceExtendedDetailModel
 */
class UserDeviceExtendedDetailModel extends ModelBase {
  /**
   * Constructor for external entity model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_device_extended_details';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.device_id
   * @param {number} dbRow.user_id
   * @param {number} dbRow.build_number
   * @param {string} dbRow.app_version
   * @param {number} dbRow.device_os
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      deviceId: dbRow.device_id,
      userId: dbRow.user_id,
      buildNumber: dbRow.build_number,
      appVersion: dbRow.app_version,
      deviceOs: userDeviceExtendedDetailConstants.deviceOs[dbRow.device_os],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Insert new parameters in the table.
   *
   * @param {object} params
   * @param {string} params.deviceId
   * @param {number} params.userId
   * @param {number} params.buildNumber
   * @param {string} params.appVersion
   * @param {string} params.deviceOs
   *
   * @returns {Promise<never>}
   */
  async insert(params) {
    const oThis = this;

    const deviceId = params.deviceId;
    const userId = params.userId;

    if (!deviceId || !userId) {
      return Promise.reject(new Error('Missing mandatory parameters.'));
    }

    const insertParams = {
      device_id: deviceId,
      user_id: userId
    };

    if (params.buildNumber) {
      insertParams.build_number = params.buildNumber;
    }

    if (params.appVersion) {
      insertParams.app_version = params.appVersion;
    }

    if (params.deviceOs) {
      const deviceOsInt = userDeviceExtendedDetailConstants.invertedDeviceOs[params.deviceOs];
      if (deviceOsInt) {
        insertParams.device_os = deviceOsInt;
      }
    }

    await oThis.insert(insertParams).fire();
  }

  /**
   * Update existing entry in table by device id and user id.
   *
   * @param {object} params
   * @param {string} params.deviceId
   * @param {number} params.userId
   * @param {number} [params.buildNumber]
   * @param {string} [params.appVersion]
   * @param {string} [params.deviceOs]
   *
   * @returns {Promise<void>}
   */
  async updateByDeviceIdAndUserId(params) {
    const oThis = this;

    const deviceId = params.deviceId;
    const userId = params.userId;

    if (!deviceId || !userId) {
      return Promise.reject(new Error('Missing mandatory parameters.'));
    }

    const updateParams = {};

    if (params.buildNumber) {
      updateParams.build_number = params.buildNumber;
    }

    if (params.appVersion) {
      updateParams.app_version = params.appVersion;
    }

    if (params.deviceOs) {
      const deviceOsInt = userDeviceExtendedDetailConstants.invertedDeviceOs[params.deviceOs];
      if (deviceOsInt) {
        updateParams.device_os = deviceOsInt;
      }
    }

    if (CommonValidators.validateNonEmptyObject(updateParams)) {
      await oThis
        .update(updateParams)
        .where({ device_id: deviceId, user_id: userId })
        .fire();

      await UserDeviceExtendedDetailModel.flushCache(params);
    }
  }

  /**
   * Get device detail by device id and user id.
   *
   * @param {object} params
   * @param {string} params.deviceId
   *
   * @returns {Promise<{}>}
   */
  async getByDeviceId(params) {
    const oThis = this;

    if (!params.deviceId) {
      return Promise.reject(new Error('Missing mandatory parameter.'));
    }

    const dbRows = await oThis
      .select('*')
      .where({ device_id: params.deviceId })
      .fire();

    const finalResponse = { [params.deviceId]: {} };

    for (let index = 0; index < dbRows.length; index++) {
      const formattedRow = oThis.formatDbData(dbRows[index]);
      finalResponse[params.deviceId][formattedRow.userId] = formattedRow;
    }

    return finalResponse;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {string} params.deviceId
   * @param {number} params.userId
   *
   * @returns {Promise<void>}
   */
  static async flushCache(params) {
    // Do nothing.
    const CacheKlass = require(rootPrefix + '/');

    await new CacheKlass(params).clear();
  }
}

module.exports = UserDeviceExtendedDetailModel;
