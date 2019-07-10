const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  userContributedByConstants = require(rootPrefix + '/lib/globalConstant/userContributedBy'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

class UserContributedBy extends ModelBase {
  /**
   * User Contributed By model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_contributed_by';
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
      contributedByUserId: dbRow.contributed_by_user_id,
      totalTransactions: dbRow.total_transactions,
      totalAmount: dbRow.total_amount,
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
    return ['id', 'userId', 'contributedByUserId', 'totalTransactions', 'totalAmount', 'createdAt', 'updatedAt'];
  }

  /***
   * Fetch user contributed by object for user id
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

module.exports = UserContributedBy;
