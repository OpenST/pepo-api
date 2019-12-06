const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
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
   * @returns {Promise<*>}
   */
  async createNewEntry(params) {
    const oThis = this;

    const deviceId = params.deviceId;
    const userId = params.userId;

    if (!deviceId || !userId) {
      logger.error(`Missing mandatory parameters. Input params: ${params}`);

      return;
    }

    const insertParams = {
      device_id: deviceId,
      user_id: userId
    };

    Object.assign(insertParams, oThis.validateOptionalParameters(params));

    await oThis.insert(insertParams).fire();

    await UserDeviceExtendedDetailModel.flushCache({ deviceIds: [deviceId] });
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
      logger.error(`Missing mandatory parameters. Input params: ${params}`);

      return;
    }

    const updateParams = oThis.validateOptionalParameters(params);

    if (CommonValidators.validateNonEmptyObject(updateParams)) {
      await oThis
        .update(updateParams)
        .where({ device_id: deviceId, user_id: userId })
        .fire();

      await UserDeviceExtendedDetailModel.flushCache({ deviceIds: [deviceId] });
    }
  }

  /**
   * Get device detail by device ids.
   *
   * @param {array<string>} deviceIds
   *
   * @returns {Promise<*>}
   */
  async getByDeviceIds(deviceIds) {
    const oThis = this;

    if (!deviceIds) {
      logger.error(`Missing mandatory parameter. Input deviceIds: ${deviceIds}`);

      return;
    }

    const dbRows = await oThis
      .select('*')
      .where({ device_id: deviceIds })
      .fire();

    const finalResponse = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formattedRow = oThis.formatDbData(dbRows[index]);
      finalResponse[formattedRow.deviceId] = finalResponse[formattedRow.deviceId] || {};
      finalResponse[formattedRow.deviceId][formattedRow.userId] = formattedRow;
    }

    return finalResponse;
  }

  /**
   * Validate optional parameters.
   *
   * @param {object} params
   * @param {number} [params.buildNumber]
   * @param {string} [params.appVersion]
   * @param {string} [params.deviceOs]
   *
   * @returns {{}}
   */
  validateOptionalParameters(params) {
    const oThis = this;

    const responseParameters = {};

    if (params.buildNumber) {
      responseParameters.build_number = oThis.validateBuildNumber(params.buildNumber);
    }

    if (params.appVersion) {
      responseParameters.app_version = oThis.validateAppVersion(params.appVersion);
    }

    if (params.deviceOs) {
      const deviceOsInt = userDeviceExtendedDetailConstants.invertedDeviceOs[params.deviceOs];
      if (deviceOsInt) {
        responseParameters.device_os = deviceOsInt;
      }
    }

    return responseParameters;
  }

  /**
   * Validate build number.
   *
   * @param {number} buildNumber
   *
   * @returns {null|number}
   */
  validateBuildNumber(buildNumber) {
    buildNumber = Number(buildNumber);
    if (buildNumber > 0) {
      return buildNumber;
    }

    return null;
  }

  /**
   * Validate app version.
   *
   * @param {string} appVersion
   *
   * @returns {null|*}
   */
  validateAppVersion(appVersion) {
    if (appVersion.split('.').length === 3) {
      return appVersion;
    }

    return null;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {array<string>} params.deviceIds
   *
   * @returns {Promise<void>}
   */
  static async flushCache(params) {
    // Do nothing.
    const UserDeviceExtendedDetailsByDeviceIdsCache = require(rootPrefix +
      '/lib/cacheManagement/multi/UserDeviceExtendedDetailsByDeviceIds');

    await new UserDeviceExtendedDetailsByDeviceIdsCache({ deviceIds: params.deviceIds }).clear();
  }
}

module.exports = UserDeviceExtendedDetailModel;
