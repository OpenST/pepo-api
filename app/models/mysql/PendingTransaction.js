const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  pendingTransactionConstants = require(rootPrefix + '/lib/globalConstant/pendingTransaction');

const dbName = 'pepo_api_' + coreConstants.environment;

class PendingTransaction extends ModelBase {
  /**
   * Constructor for Pending Transaction model.
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
    return {
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
