const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.userDbName;

/**
 * Class for user stat model.
 *
 * @class UserStat
 */
class UserStat extends ModelBase {
  /**
   * Constructor for user stat model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_stats';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.user_id
   * @param {number} dbRow.total_contributed_by
   * @param {number} dbRow.total_contributed_to
   * @param {number} dbRow.total_amount_raised
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
      totalContributedBy: dbRow.total_contributed_by,
      totalContributedTo: dbRow.total_contributed_to,
      totalAmountRaised: dbRow.total_amount_raised,
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
    return ['id', 'userId', 'totalContributedTo', 'totalContributedBy', 'totalAmountRaised', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch user stat object for user id.
   *
   * @param {string} userId: user id
   *
   * @return {object}
   */
  async fetchByUserId(userId) {
    const oThis = this;

    const dbRows = await oThis.fetchByUserIds([userId]);

    return dbRows[userId] || {};
  }

  /**
   * Fetch user stats object for given user_ids.
   *
   * @param {array} userIds: user ids
   *
   * @return {object}
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
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.totalContributedBy
   * @param {number} params.totalContributedTo
   * @param {number} params.totalAmountRaised
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

    await new UserStatByUserIds({ userIds: [params.userId] }).clear();
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
