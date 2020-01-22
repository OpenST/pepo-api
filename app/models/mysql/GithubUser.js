const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables names.
const dbName = databaseConstants.socialConnectDbName;

/**
 * Class for github user model.
 *
 * @class GithubUserModel
 */
class GithubUserModel extends ModelBase {
  /**
   * Constructor for github user model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'github_users';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.github_id
   * @param {number} dbRow.user_id
   * @param {string} dbRow.user_name
   * @param {string} dbRow.name
   * @param {string} dbRow.email
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
      githubId: dbRow.github_id,
      userId: dbRow.user_id,
      userName: dbRow.user_name,
      name: dbRow.name,
      email: dbRow.email,
      profileImageUrl: dbRow.profile_image_url,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch github user by user id.
   *
   * @param userIds
   * @returns {Promise<void>}
   */
  async fetchByUserIds(userIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ user_id: userIds })
      .fire();

    const response = {};
    for (let ind = 0; ind < dbRows.length; ind++) {
      const formattedData = oThis.formatDbData(dbRows[ind]);
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

module.exports = GithubUserModel;
