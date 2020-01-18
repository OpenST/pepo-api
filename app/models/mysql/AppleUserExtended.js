const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables names.
const dbName = databaseConstants.socialConnectDbName;

/**
 * Class for apple user extended.
 *
 * @class AppleUserExtendedModel
 */
class AppleUserExtendedModel extends ModelBase {
  /**
   * Constructor for apple user extended model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'apple_users_extended';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.apple_user_id
   * @param {string} dbRow.access_token
   * @param {string} dbRow.refresh_token
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      appleUserId: dbRow.apple_user_id,
      accessToken: dbRow.access_token,
      refreshToken: dbRow.refresh_token,
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
    return ['id', 'appleUserId', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch apple user extended obj by apple user id.
   *
   * @param appleUserId
   * @returns {Promise<void>}
   */
  async fetchByAppleUserId(appleUserId) {
    const oThis = this;

    const dbRow = await oThis
      .select('*')
      .where({ apple_user_id: appleUserId })
      .fire();

    return oThis.formatDbData(dbRow[0]);
  }
}

module.exports = AppleUserExtendedModel;
