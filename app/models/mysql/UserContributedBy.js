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
   * Fetch users contributed by object
   * contributedByUserId paid to user ids
   *
   * @param userIds {Array} - Array of user id
   * @param contributedByUserId {Integer} - id of user who contributed to userId
   *
   * @return {Object}
   */
  async fetchByUserIdsAndcontributedByUserId(userIds, contributedByUserId) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where({ user_id: userIds, contributedByUserId: contributedByUserId })
      .fire();

    let response = {};

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

module.exports = UserContributedBy;
