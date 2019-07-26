const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  userTagConstants = require(rootPrefix + '/lib/globalConstant/userTag'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.userDbName;

/**
 * Class for user tag model.
 *
 * @class UserTag
 */
class UserTag extends ModelBase {
  /**
   * Constructor for user tag model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_tags';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.user_id
   * @param {number} dbRow.tag_id
   * @param {string} dbRow.kind
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
      tagId: dbRow.tag_id,
      kind: userTagConstants.kinds[dbRow.kind],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch user tags by user ids.
   *
   * @param {array} userIds
   *
   * @returns {Promise<void>}
   */
  async fetchByUserIds(userIds) {
    const oThis = this;

    const response = {};

    const dbRows = await oThis
      .select('*')
      .where(['user_id IN (?)', userIds])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.userId] = response[formatDbRow.userId] || {
        [userTagConstants.selfAddedKind]: [],
        [userTagConstants.derivedKind]: []
      };
      response[formatDbRow.userId][formatDbRow.kind].push(formatDbRow.tagId);
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.userId
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const UserTagsByUserIds = require(rootPrefix + '/lib/cacheManagement/multi/UserTagsByUserIds');

    await new UserTagsByUserIds({ userIds: [params.userId] }).clear();
  }
}

module.exports = UserTag;
