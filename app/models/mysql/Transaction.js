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
      ostTxId: dbRow.ost_tx_id,
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
   * Fetch transactions by ost transaction id.
   *
   * @param {Array} ostTxIds
   * @returns {Promise<void>}
   */
  async fetchByOstTxId(ostTxIds) {
    const oThis = this;

    let response = {},
      dbRows = await oThis
        .select(['*'])
        .where(['ost_tx_id IN (?)', ostTxIds])
        .fire();

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRows = oThis.formatDbData(dbRows[index]);
      response[formatDbRows.ostTxId] = formatDbRows;
    }

    return response;
  }

  /**
   * Fetch transaction for given ids
   *
   * @param ids {array} - tx ids
   *
   * @return {object}
   */
  async fetchByIds(ids) {
    const oThis = this;
    let response = {};

    let dbRows = await oThis
      .select('*')
      .where({ id: ids })
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis.formatDbData(dbRows[index]);
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
    const TransactionByOstTxId = require(rootPrefix + '/lib/cacheManagement/multi/TransactionByOstTxId');

    await new TransactionByOstTxId({
      ostTxIds: [params.ostTxId]
    }).clear();
  }

  static get transactionIdUniqueIndexName() {
    return 'uidx_1';
  }
}

module.exports = Transaction;
