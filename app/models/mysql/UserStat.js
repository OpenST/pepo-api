const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  userStatConstants = require(rootPrefix + '/lib/globalConstant/userStat'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

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

  /***
   * Flush cache
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {}
}

module.exports = UserStat;
