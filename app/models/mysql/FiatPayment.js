const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  ostPricePointConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints');

// Declare variables.
const dbName = databaseConstants.fiatDbName;

/**
 * Class for fiat payments model.
 *
 * @class FiatPayment
 */
class FiatPayment extends ModelBase {
  /**
   * Constructor for fiat payments model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'fiat_payments';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {object} dbRow.raw_receipt
   * @param {string/number} dbRow.from_user_id
   * @param {string/number} dbRow.to_user_id
   * @param {number} dbRow.kind
   * @param {number} dbRow.service_kind
   * @param {number} dbRow.currency
   * @param {number} dbRow.amount
   * @param {number} dbRow.pepo_amount
   * @param {number} dbRow.card_detail_id
   * @param {number} dbRow.risk_score
   * @param {number} dbRow.transaction_id
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
      receiptId: dbRow.receipt_id,
      rawReceipt: dbRow.raw_receipt ? JSON.parse(dbRow.raw_receipt) : null,
      decryptedReceipt: dbRow.decrypted_receipt ? JSON.parse(dbRow.decrypted_receipt) : null,
      fromUserId: dbRow.from_user_id,
      toUserId: dbRow.to_user_id,
      kind: fiatPaymentConstants.kinds[dbRow.kind],
      serviceKind: fiatPaymentConstants.serviceKinds[dbRow.service_kind],
      currency: ostPricePointConstants.quoteCurrencies[dbRow.currency],
      amount: dbRow.amount,
      pepoAmount: dbRow.pepo_amount,
      transactionId: dbRow.transaction_id,
      status: fiatPaymentConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch fiat payment transaction for given ids.
   *
   * @param {array} ids: tx ids
   *
   * @return {object}
   */
  async fetchByIds(ids) {
    const oThis = this;

    const response = {};

    console.log('ids------------------', ids);
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
   * Fetch fiat payment transaction for given ids.
   *
   * @param {array} ids: tx ids
   *
   * @return {object}
   */
  async fetchByReceiptIdAndKind(receiptId, serviceKind) {
    const oThis = this;

    const response = {};

    const dbRows = await oThis
      .select('*')
      .where({ receipt_id: receiptId, service_kind: fiatPaymentConstants.invertedServiceKinds[serviceKind] })
      .fire();

    if (dbRows[0]) {
      return oThis.formatDbData(dbRows[0]);
    } else {
      return null;
    }
  }

  /**
   * Update transaction status by referenceId.
   *
   * @param {number} referenceId
   * @param {string} status
   *
   * @returns {Promise<any>}
   */
  async updateTransactionStatusById(id, status) {
    const oThis = this;

    const statusInt = fiatPaymentConstants.invertedStatuses[status];

    if (!statusInt) {
      return Promise.reject(new Error('Invalid fiat payment status.'));
    }

    await oThis
      .update({
        status: statusInt
      })
      .where({ id: id })
      .fire();
  }

  /**
   * User ids
   *
   * @param {Array} userIds
   * @returns {Promise<void>}
   */
  async fetchRecentMonthPayments(userIds) {
    const oThis = this;

    let currentTimestamp = basicHelper.getCurrentTimestampInSeconds(),
      beforeOneMonthTimestamp = currentTimestamp - 2592000;

    let queryResponse = await oThis
        .select('*')
        .where(['from_user_id IN (?) AND updated_at > ?', userIds, beforeOneMonthTimestamp])
        .fire(),
      responseData = {};

    for (let i = 0; i < queryResponse.length; i++) {
      const oThis = this;

      if (!responseData[queryResponse[i].from_user_id]) {
        responseData[queryResponse[i].from_user_id] = [];
      }

      responseData[queryResponse[i].from_user_id].push(oThis.formatDbData(queryResponse[i]));
    }

    return responseData;
  }

  /**
   * Fetch life time payments
   *
   * @param userIds
   * @returns {Promise<void>}
   */
  async fetchLifeTimePayments(userId) {
    const oThis = this;

    let totalAmount = 0,
      queryResponse = await oThis
        .select('sum(amount) as amount')
        .where(['from_user_id = ?', userId])
        .fire();

    if (queryResponse[0].amount) {
      totalAmount = queryResponse[0].amount;
    }

    return { amount: totalAmount };
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {array} params.referenceIds
   * @param {array} params.ids
   *
   * @returns {Promise<*>}
   */
  static async flushCache() {
    const promisesArray = [];

    await Promise.all(promisesArray);
  }
}

module.exports = FiatPayment;
