const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  database = require(rootPrefix + '/lib/globalConstant/database'),
  userTagConstants = require(rootPrefix + '/lib/globalConstant/userTag');

const dbName = database.userDbName;

class UserTag extends ModelBase {
  /**
   * User Stat model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_tags';
  }

  /**
   *
   * @param dbRow
   * @return {object}
   */
  formatDbData(dbRow) {
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      tagId: dbRow.tag_id,
      kind: userTagConstants.kinds[dbRow.kind],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Fetch user tags by user ids
   *
   * @param userIds
   * @returns {Promise<void>}
   */
  async fetchByUserIds(userIds) {
    const oThis = this;
    let response = {};

    let dbRows = await oThis
      .select('*')
      .where(['user_id IN (?)', userIds])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis.formatDbData(dbRows[index]);
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

    await new UserTagsByUserIds({
      userIds: [params.userId]
    }).clear();
  }
}

module.exports = UserTag;
