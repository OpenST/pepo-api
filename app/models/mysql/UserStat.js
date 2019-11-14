const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

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
   * @param {number} dbRow.total_amount_spent
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
      totalAmountSpent: dbRow.total_amount_spent,
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
    return [
      'id',
      'userId',
      'totalContributedTo',
      'totalContributedBy',
      'totalAmountRaised',
      'totalAmountSpent',
      'createdAt',
      'updatedAt'
    ];
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
        'total_amount_raised = total_amount_raised + ?, ' +
          'total_amount_spent = total_amount_spent + ?, ' +
          'total_contributed_by = total_contributed_by + ?, ' +
          'total_contributed_to = total_contributed_to + ?',
        params.totalAmountRaised,
        params.totalAmountSpent,
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
   * @param {number} params.totalAmountSpent
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
        total_amount_raised: params.totalAmountRaised,
        total_amount_spent: params.totalAmountSpent
      })
      .fire();
  }

  /**
   * Update user stat. If user does not exist, create a new user.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.totalContributedBy
   * @param {number} params.totalContributedTo
   * @param {number} params.totalAmountRaised
   * @param {number} params.totalAmountSpent
   *
   * @returns {Promise<void>}
   */
  static async updateOrCreateUserStat(params) {
    const updateResponse = await new UserStat().updateUserStat(params);

    if (updateResponse.affectedRows === 0) {
      await new UserStat().createUserStat(params).catch(async function(err) {
        if (UserStat.isDuplicateIndexViolation(UserStat.userIdUniqueIndexName, err)) {
          await new UserStat().updateUserStat(params);
        } else {
          const errorObject = responseHelper.error({
            internal_error_identifier: 'l_us_6',
            api_error_identifier: 'something_went_wrong',
            debug_options: { Reason: 'User stats not updated for given user id.', userId: params.userId }
          });
          createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

          return Promise.reject(errorObject);
        }
      });
    }
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
