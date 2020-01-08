const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction');

// Declare variables.
const dbName = databaseConstants.feedDbName;

/**
 * Class for transaction model.
 *
 * @class Transaction
 */
class Transaction extends ModelBase {
  /**
   * Constructor for transaction model.
   *
   * @augments ModelBase
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
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      ostTxId: dbRow.ost_tx_id,
      fromUserId: dbRow.from_user_id,
      toUserId: dbRow.to_user_id,
      amount: dbRow.amount,
      kind: transactionConstants.kinds[dbRow.kind],
      fiatPaymentId: dbRow.fiat_payment_id,
      videoId: dbRow.video_id,
      extraData: JSON.parse(dbRow.extra_data),
      textId: dbRow.text_id,
      status: transactionConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch transactions by ost transaction id.
   *
   * @param {array} ostTxIds
   *
   * @returns {Promise<void>}
   */
  async fetchByOstTxId(ostTxIds) {
    const oThis = this;

    const response = {},
      dbRows = await oThis
        .select('*')
        .where(['ost_tx_id IN (?)', ostTxIds])
        .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRows = oThis.formatDbData(dbRows[index]);
      response[formatDbRows.ostTxId] = formatDbRows;
    }

    return response;
  }

  /**
   * Fetch transaction for given ids
   *
   * @param {array} ids: tx ids
   *
   * @return {object}
   */
  async fetchByIds(ids) {
    const oThis = this;
    const response = {};

    const dbRows = await oThis
      .select('*')
      .where({ id: ids })
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.id
   * @param {number} params.ostTxId
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    const TransactionByOstTxId = require(rootPrefix + '/lib/cacheManagement/multi/TransactionByOstTxId');
    promisesArray.push(new TransactionByOstTxId({ ostTxIds: [params.ostTxId] }).clear());

    const TransactionByIds = require(rootPrefix + '/lib/cacheManagement/multi/TransactionByIds');
    promisesArray.push(new TransactionByIds({ ids: [params.id] }).clear());

    await Promise.all(promisesArray);
  }

  /**
   * Get transaction id unique index name.
   *
   * @returns {string}
   */
  static get transactionIdUniqueIndexName() {
    return 'uidx_1';
  }
}

module.exports = Transaction;
