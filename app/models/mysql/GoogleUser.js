const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.socialConnectDbName;

/**
 * Class for google user model.
 *
 * @class GoogleUser
 */
class GoogleUser extends ModelBase {
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

    oThis.tableName = 'google_users';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.google_id
   * @param {number} dbRow.user_id
   * @param {string} dbRow.email
   * @param {string} dbRow.name
   * @param {string} dbRow.profile_image_url
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      googleId: dbRow.google_id,
      userId: dbRow.user_id,
      email: dbRow.email,
      name: dbRow.name,
      profileImageUrl: dbRow.profile_image_url,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch by user ids
   * @param {Array} userIds
   *
   * @returns {Promise<void>}
   */
  async fetchByUserIds(userIds) {
    const oThis = this;

    const Rows = await oThis
      .select('id, user_id, google_id')
      .where({ user_id: userIds })
      .fire();

    const response = {};
    for (let ind = 0; ind < Rows.length; ind++) {
      const formattedData = oThis.formatDbData(Rows[ind]);
      response[formattedData.userId] = formattedData;
    }

    return response;
  }
}

module.exports = GoogleUser;
