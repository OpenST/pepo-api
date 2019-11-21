const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.userDbName;

/**
 * Class for user mute model.
 *
 * @class UserMute
 */
class UserMute extends ModelBase {
  /**
   * Constructor for user mute model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_mutes';
  }

  /**
   * Format db Data
   *
   * @param {Object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.user1_id (user1_id has muted user2_id). if 0 then muted for all by admin
   * @param {number} dbRow.user2_id
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      user1Id: dbRow.user1_id,
      user2Id: dbRow.user2_id,
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
    return ['id', 'user1Id', 'user2Id', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch mute user objects by user 2 ids.
   *
   * @param {array} user2Ids: Array of user 2 Ids.
   *
   * @return {object}
   */
  async fetchForAllByUser2Ids(user2Ids) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ user2_id: user2Ids })
      .where({ user1_id: [0] })
      .fire();

    const response = {};
    for (let index = 0; index < user2Ids.length; index++) {
      response[user2Ids[index]] = { all: 0 };
    }

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      // TODO - mute - is following condition needed? Query already has proper where clause.
      if (formatDbRow.user1Id == 0) {
        response[formatDbRow.user2Id]['all'] = 1;
      }
    }

    return response;
  }

  /**
   * Index name
   *
   * @returns {string}
   */
  static get userRelationUniqueIndexName() {
    return 'uk_1';
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.user2Ids
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.user2Id) {
      const UserMuteByUser2IdsForGlobalCache = require(rootPrefix +
        '/lib/cacheManagement/multi/UserMuteByUser2IdsForGlobal');
      promisesArray.push(new UserMuteByUser2IdsForGlobalCache({ user2Ids: [params.user2Id] }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = UserMute;
