const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  ostPricePointConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints');

const dbName = databaseConstants.fiatDbName;

class FiatPayment extends ModelBase {
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
   * Fetch by ids
   *
   * @param ids {array} - array of ids
   * @return {Promise<void>}
   */
  async fetchByIds(ids) {
    const oThis = this,
      response = {};

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
   * Fetch by receipt id and service kind
   *
   * @param receiptId - receipt id
   * @param serviceKind - service kind
   *
   * @return {Promise<*>}
   */
  async fetchByReceiptIdAndServiceKind(receiptId, serviceKind) {
    const oThis = this;

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
   * Fetch life time purchase amount for a user id
   *
   * @param userId - user id for which the total purchase amount has to be summed.
   *
   * @returns {Promise<void>}
   */
  async fetchTotalPurchaseAmountFor(userId) {
    const oThis = this;

    let totalAmount = 0,
      queryResponse = await oThis
        .select('sum(amount) as total_purchase_amount')
        .where(['from_user_id = ?', userId])
        .fire();

    if (queryResponse[0].total_purchase_amount) {
      totalAmount = queryResponse[0].total_purchase_amount;
    }

    return { amount: totalAmount };
  }

  /**
   * Fetch by user id and statuses
   *
   * @param userId - user id for which the dfiat payment is to be fetched
   * @param statuses {array} - array of statuses used for filtering
   *
   * @return {Promise<void>}
   */
  async fetchByUserIdAndStatus(userId, statuses) {
    const oThis = this;

    let rows = await oThis
        .select('*')
        .where({
          from_user_id: userId,
          status: statuses
        })
        .fire(),
      responseData = {};

    responseData[userId] = [];

    for (let i = 0; i < rows.length; i++) {
      const oThis = this;

      responseData[rows[i].from_user_id].push(oThis.formatDbData(rows[i]));
    }

    return responseData;
  }

  /**
   * Flush cache
   *
   * @param id - id of the record for which to flush cache
   * @return {Promise<*>}
   */
  static async flushCache(params) {
    let promisrArray = [],
      UserPaymentsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserPaymentsByIds'),
      LifetimePurchaseByUserIdCache = require(rootPrefix + '/lib/cacheManagement/single/LifetimePurchaseByUserId');

    if (params.fiatPaymentId) {
      const userPaymentsByIdsCacheObj = new UserPaymentsByIdsCache({ ids: [params.fiatPaymentId] });
      promisrArray.push(userPaymentsByIdsCacheObj.clear());
    }

    if (params.userId) {
      const lifetimePurchaseByUserIdCacheObj = new LifetimePurchaseByUserIdCache({ userId: params.userId });
      promisrArray.push(lifetimePurchaseByUserIdCacheObj.clear());
    }

    return Promise.all(promisrArray);
  }
}

module.exports = FiatPayment;
