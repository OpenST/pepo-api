const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction');

const dbName = 'pepo_api_' + coreConstants.environment;

class Transaction extends ModelBase {
  /**
   * Constructor for Transaction model.
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'transactions';
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
      extraData: JSON.parse(dbRow.extra_data),
      textId: dbRow.text_id,
      giphyId: dbRow.giphy_id,
      status: transactionConstants.statuses[dbRow.status],
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

module.exports = Transaction;
