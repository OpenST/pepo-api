const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.socialConnectDbName;

/**
 * Class for google user extended model.
 *
 * @class GoogleUserExtended
 */
class GoogleUserExtended extends ModelBase {
  /**
   * Constructor for user identifier model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'google_users_extended';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.google_user_id
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
      googleUserId: dbRow.google_user_id,
      accessToken: dbRow.access_token,
      refreshToken: dbRow.refresh_token,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch by google user id.
   *
   * @param googleUserId
   * @returns {Promise<void>}
   */
  async fetchByGoogleUserId(googleUserId) {
    const oThis = this;

    const dbRow = await oThis
      .select('*')
      .where({ google_user_id: googleUserId })
      .fire();

    if (dbRow.length == 0) {
      return null;
    }

    return oThis.formatDbData(dbRow[0]);
  }
}

module.exports = GoogleUserExtended;
