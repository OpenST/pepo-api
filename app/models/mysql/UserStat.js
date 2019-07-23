const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.userDbName;

class UserStat extends ModelBase {
  /**
   * User Stat model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_stats';
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
      totalContributedBy: dbRow.total_contributed_by,
      totalContributedTo: dbRow.total_contributed_to,
      totalAmountRaised: dbRow.total_amount_raised,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * List Of Formatted Column names that can be exposed by service
   *
   *
   * @returns {Array}
   */
  safeFormattedColumnNames() {
    return ['id', 'userId', 'totalContributedTo', 'totalContributedBy', 'totalAmountRaised', 'createdAt', 'updatedAt'];
  }

  /***
   * Fetch user stat object for user id
   *
   * @param userId {String} - user id
   *
   * @return {Object}
   */
  async fetchByUserId(userId) {
    const oThis = this;

    let dbRows = await oThis.fetchByUserIds([userId]);

    return dbRows[id] || {};
  }

  /**
   * Fetch videos for given ids
   *
   * @param ids {array} - image ids
   *
   * @return {object}
   */

  /***
   * Fetch user stats object for given user_ids
   *
   * @param userIds {Array} - user ids
   *
   * @return {Object}
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
      response[formatDbRow.userId] = formatDbRow;
    }

    return response;
  }

  /**
   * Update user stats.
   *
   * @returns {Promise<void>}
   */
  async updateUserStat(params) {
    const oThis = this;

    return oThis
      .update([
        'total_amount_raised = total_amount_raised + ?, total_contributed_by = total_contributed_by + ?, total_contributed_to = total_contributed_to + ?',
        params.totalAmountRaised,
        params.totalContributedBy,
        params.totalContributedTo
      ])
      .where({ user_id: params.userId })
      .fire();
  }

  /**
   * Create user stats.
   *
   * @returns {Promise<void>}
   */
  async createUserStat(params) {
    const oThis = this;

    return oThis
      .insert({
        user_id: params.userId,
        total_contributed_by: params.totalContributedBy,
        total_contributed_to: params.totalContributedTo,
        total_amount_raised: params.totalAmountRaised
      })
      .fire();
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
    const UserStatByUserIds = require(rootPrefix + '/lib/cacheManagement/multi/UserStatByUserIds');

    await new UserStatByUserIds({
      userIds: [params.userId]
    }).clear();
  }

  /**
   * Index name
   *
   * @returns {string}
   */
  static get userIdUniqueIndexName() {
    return 'idx_1';
  }
}

module.exports = UserStat;
