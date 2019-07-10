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
      totalContributedTo: dbRow.total_contributed_to,
      totalContributedBy: dbRow.total_contributed_by,
      totalAmountRaised: dbRow.total_amoun_raised,
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
    let dbRows = await oThis
      .select('*')
      .where({ user_id: userId })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
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
