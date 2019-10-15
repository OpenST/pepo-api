const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  pepocornTransactionConstants = require(rootPrefix + '/lib/globalConstant/redemption/pepocornTransaction'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.redemptionDbName;

/**
 * Class for pepocorn transaction model.
 *
 * @class PepocornTransactionModel
 */
class PepocornTransactionModel extends ModelBase {
  /**
   * Constructor for pepocorn transaction model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'pepocorn_transactions';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.user_id
   * @param {number} dbRow.kind
   * @param {number} dbRow.pepocornAmount
   * @param {number} dbRow.transactionId
   * @param {number} dbRow.redemptionId
   * @param {number} dbRow.status
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
      kind: pepocornTransactionConstants.kinds[dbRow.kind],
      pepocornAmount: dbRow.pepocorn_amount,
      transactionId: dbRow.transaction_id,
      redemptionId: dbRow.redemption_id,
      status: pepocornTransactionConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   *
   * @returns {Promise<void>}
   */
  static async flushCache(params) {}
}

module.exports = PepocornTransactionModel;
