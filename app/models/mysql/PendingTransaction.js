const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  pendingTransactionConstants = require(rootPrefix + '/lib/globalConstant/pendingTransaction');

// Declare variables.
const dbName = databaseConstants.feedDbName;

/**
 * Class for pending transaction model.
 *
 * @class PendingTransaction
 */
class PendingTransaction extends ModelBase {
  /**
   * Constructor for pending transaction model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'pending_transactions';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      ostTxid: dbRow.ost_tx_id,
      fromUserId: dbRow.from_user_id,
      videoId: dbRow.video_id,
      toUserId: dbRow.to_user_id,
      amount: dbRow.amount,
      status: pendingTransactionConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.id
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {}
}

module.exports = PendingTransaction;
