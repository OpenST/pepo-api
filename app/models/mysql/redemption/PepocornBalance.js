const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.redemptionDbName;

/**
 * Class for pepocorn balances model.
 *
 * @class PepocornBalancesModel
 */
class PepocornBalancesModel extends ModelBase {
  /**
   * Constructor for pepocorn balances model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'pepocorn_balances';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.user_id
   * @param {number} dbRow.balance
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
      balance: dbRow.balance,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Update balance of user.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.balance
   *
   * @returns {Promise<any>}
   */
  async updateBalance(params) {
    const oThis = this;

    return oThis
      .update({ balance: params.balance })
      .where({ user_id: params.userId })
      .fire();
  }

  /**
   * Fetch user's balance.
   *
   * @param {object} params
   * @param {number} params.userId
   *
   * @returns {Promise<{}>}
   */
  async fetchUserBalance(params) {
    const oThis = this;

    const dbRow = await oThis
      .select('*')
      .where({ user_id: params.userId })
      .fire();

    return oThis.formatDbData(dbRow[0]);
  }

  /**
   * Fetch pepocorn balance object for given user Ids.
   *
   * @param {array} userIds: user ids
   *
   * @return {object}
   */
  async fetchBalanceByUserIds(userIds) {
    const oThis = this;

    const response = {};

    const dbRows = await oThis
      .select('user_id, balance, updated_at')
      .where(['user_id IN (?)', userIds])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.userId] = formatDbRow;
    }

    return response;
  }

  /**
   * Index name
   *
   * @returns {string}
   */
  static get userIdUniqueIndexName() {
    return 'un_idx_1';
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {array<number>} [params.userIds]
   *
   * @returns {Promise<void>}
   */
  static async flushCache(params) {
    if (params.userIds) {
      const PepocornBalanceByUserIds = require(rootPrefix + '/lib/cacheManagement/multi/PepocornBalanceByUserIds');
      await new PepocornBalanceByUserIds({ userIds: params.userIds }).clear();
    }
  }
}

module.exports = PepocornBalancesModel;
