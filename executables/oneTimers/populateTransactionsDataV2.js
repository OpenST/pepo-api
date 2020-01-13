/**
 * One time to populate transactions data.
 *
 * Usage: node executables/oneTimers/populateTransactionsDataV2.js
 *
 * @module executables/oneTimers/populateTransactionsDataV2
 */
const command = require('commander');

const rootPrefix = '../..',
  cacheProvider = require(rootPrefix + '/lib/providers/memcached'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const BATCH_SIZE = 25;

command
  .version('0.1.0')
  .usage('[options]')
  .option('-f, --transactionId <transactionId>', 'id of the transaction table')
  .parse(process.argv);

/**
 * class for populate transactions data
 *
 * @class PopulateTransactionsDataV2
 */
class PopulateTransactionsDataV2 {
  /**
   * constructor to populate transactions data
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.totalRowsFound = null;
    oThis.transactionsById = {};
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._performBatch();

    await oThis._flushCache();
  }

  /**
   * Perform batch
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performBatch() {
    const oThis = this;

    oThis.transactionId = command.transactionId ? command.transactionId : 0;

    let limit = BATCH_SIZE,
      offset = 0;
    while (true) {
      await oThis._fetchTransaction(limit, offset);
      // No more records present to migrate
      if (oThis.totalRowsFound === 0) {
        break;
      }

      await oThis._updateTransactions();

      oThis.transactionsById = {};

      offset = offset + BATCH_SIZE;
    }
  }

  /**
   * Fetch transaction
   *
   * @param limit
   * @param offset
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTransaction(limit, offset) {
    const oThis = this;

    let transactionsData = await new TransactionModel()
      .select('*')
      .where(['id > (?)', oThis.transactionId])
      .limit(limit)
      .offset(offset)
      .fire();

    for (let index = 0; index < transactionsData.length; index++) {
      const formatDbRow = new TransactionModel().formatDbData(transactionsData[index]);
      oThis.transactionsById[formatDbRow.id] = formatDbRow;
    }

    oThis.totalRowsFound = transactionsData.length;
  }

  /**
   * Update transactions.
   *
   * @returns {Promise<>}
   * @private
   */
  async _updateTransactions() {
    const oThis = this;

    for (let id in oThis.transactionsById) {
      let transaction = oThis.transactionsById[id],
        extraData = transaction.extraData;

      delete extraData['toUserIds'];
      delete extraData['amounts'];
      delete extraData['kind'];

      let updateData = {
        extra_data: JSON.stringify(extraData)
      };

      await new TransactionModel()
        .update(updateData)
        .where({ id: id })
        .fire();
    }
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    const oThis = this;

    let cacheObject = await cacheProvider.getInstance();

    return cacheObject.cacheInstance.delAll();
  }
}

new PopulateTransactionsDataV2({})
  .perform()
  .then(function(rsp) {
    logger.log('Completed Successfully!!!');
    process.exit(0);
  })
  .catch(function(err) {
    logger.log(err);
    process.exit(1);
  });
