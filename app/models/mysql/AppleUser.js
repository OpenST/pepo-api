const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables names.
const dbName = databaseConstants.socialConnectDbName;

/**
 * Class for apple user model.
 *
 * @class AppleUserModel
 */
class AppleUserModel extends ModelBase {
  /**
   * Constructor for apple user model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'apple_users';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.apple_id
   * @param {number} dbRow.user_id
   * @param {string} dbRow.name
   * @param {string} dbRow.email
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      appleId: dbRow.apple_id,
      userId: dbRow.user_id,
      name: dbRow.name,
      email: dbRow.email,
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
      .select('id, user_id, apple_id')
      .where({ user_id: userIds })
      .fire();

    const response = {};
    for (let ind = 0; ind < Rows.length; ind++) {
      const formattedData = oThis.formatDbData(Rows[ind]);
      response[formattedData.userId] = formattedData;
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {}
}

module.exports = AppleUserModel;
