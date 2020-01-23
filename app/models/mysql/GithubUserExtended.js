const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables names.
const dbName = databaseConstants.socialConnectDbName;

/**
 * Class for github user extended.
 *
 * @class GithubUserExtendedModel
 */
class GithubUserExtendedModel extends ModelBase {
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

    oThis.tableName = 'github_users_extended';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.github_user_id
   * @param {string} dbRow.access_token
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      githubUserId: dbRow.github_user_id,
      accessToken: dbRow.access_token,
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
    return ['id', 'githubUserId', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch github user extended obj by github user id.
   *
   * @param githubUserId
   * @returns {Promise<void>}
   */
  async fetchByGithubUserId(githubUserId) {
    const oThis = this;

    const dbRow = await oThis
      .select('*')
      .where({ github_user_id: githubUserId })
      .fire();

    if (dbRow.length == 0) {
      return null;
    }

    return oThis.formatDbData(dbRow[0]);
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

module.exports = GithubUserExtendedModel;
