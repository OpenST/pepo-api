const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiat/fiatPayment'),
  ostPricePointConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints');

// Declare variables.
const dbName = databaseConstants.fiatDbName;

/**
 * Class for fiat payment model.
 *
 * @class FiatPaymentModel
 */
class FiatPaymentModel extends ModelBase {
  /**
   * Constructor for fiat payment model.
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
   * @param {string} dbRow.receipt_id
   * @param {string} dbRow.raw_receipt
   * @param {string} dbRow.decrypted_receipt
   * @param {string} dbRow.error_data
   * @param {string/number} dbRow.from_user_id
   * @param {string/number} dbRow.to_user_id
   * @param {number} dbRow.kind
   * @param {number} dbRow.service_kind
   * @param {number} dbRow.currency
   * @param {number} dbRow.amount
   * @param {number} dbRow.pepo_amount_in_wei
   * @param {number} dbRow.card_detail_id
   * @param {number} dbRow.risk_score
   * @param {number} dbRow.transaction_id
   * @param {number} dbRow.status
   * @param {number} dbRow.retry_after
   * @param {number} dbRow.retry_count
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @returns {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      receiptId: dbRow.receipt_id,
      rawReceipt: dbRow.raw_receipt ? JSON.parse(dbRow.raw_receipt) : null,
      decryptedReceipt: dbRow.decrypted_receipt ? JSON.parse(dbRow.decrypted_receipt) : null,
      errorData: dbRow.error_data ? JSON.parse(dbRow.error_data) : null,
      fromUserId: dbRow.from_user_id,
      toUserId: dbRow.to_user_id,
      kind: fiatPaymentConstants.kinds[dbRow.kind],
      serviceKind: fiatPaymentConstants.serviceKinds[dbRow.service_kind],
      currency: ostPricePointConstants.quoteCurrencies[dbRow.currency],
      amount: dbRow.amount,
      pepoAmountInWei: dbRow.pepo_amount_in_wei,
      transactionId: dbRow.transaction_id,
      status: fiatPaymentConstants.statuses[dbRow.status],
      retryAfter: dbRow.retry_after,
      retryCount: dbRow.retry_count,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch by ids.
   *
   * @param {array} ids
   *
   * @returns {Promise<void>}
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
   * Fetch by receipt id and service kind.
   *
   * @param {string} receiptId: receipt id
   * @param {number} serviceKind: service kind
   *
   * @returns {Promise<*>}
   */
  async fetchByReceiptIdAndServiceKind(receiptId, serviceKind) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ receipt_id: receiptId, service_kind: fiatPaymentConstants.invertedServiceKinds[serviceKind] })
      .fire();

    if (dbRows[0]) {
      return oThis.formatDbData(dbRows[0]);
    }

    return null;
  }

  /**
   * Fetch life time purchase amount and total pepo amount purchased for a user id.
   *
   * @param {array} userIds: user ids for which the total purchase amount and total pepo amount has to be summed.
   *
   * @returns {Promise<void>}
   */
  async fetchTotalPurchaseAmountFor(userIds) {
    const oThis = this;

    const queryResponse = await oThis
      .select('from_user_id, sum(amount) as total_purchase_amount')
      .where([
        'from_user_id IN (?) AND status = ?',
        userIds,
        fiatPaymentConstants.invertedStatuses[fiatPaymentConstants.pepoTransferSuccessStatus]
      ])
      .group_by(['from_user_id'])
      .fire();

    const response = {};

    for (let index = 0; index < userIds.length; index++) {
      response[userIds[index]] = { amount: 0 };
    }

    for (let index = 0; index < queryResponse.length; index++) {
      const dbRow = queryResponse[index];
      response[dbRow.from_user_id] = { amount: dbRow.total_purchase_amount };
    }

    return response;
  }

  /**
   * Fetch by user id and statuses.
   *
   * @param {number} userId: user id for which the fiat payment is to be fetched
   * @param {array} statuses: array of statuses used for filtering
   *
   * @returns {Promise<void>}
   */
  async fetchByUserIdAndStatus(userId, statuses) {
    const oThis = this;

    const rows = await oThis
        .select('*')
        .where({
          from_user_id: userId,
          status: statuses
        })
        .fire(),
      responseData = {};

    responseData[userId] = [];

    for (let index = 0; index < rows.length; index++) {
      responseData[rows[index].from_user_id].push(oThis.formatDbData(rows[index]));
    }

    return responseData;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {integer} [params.fiatPaymentId]
   * @param {integer} [params.userId]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promiseArray = [];

    if (params.fiatPaymentId) {
      const UserPaymentsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserPaymentsByIds');
      const userPaymentsByIdsCacheObj = new UserPaymentsByIdsCache({ ids: [params.fiatPaymentId] });
      promiseArray.push(userPaymentsByIdsCacheObj.clear());
    }

    if (params.userId) {
      const LifetimePurchaseByUserIdsCache = require(rootPrefix +
          '/lib/cacheManagement/multi/LifetimePurchaseByUserIds'),
        UserPendingTopupCache = require(rootPrefix + '/lib/cacheManagement/single/UserPendingTopups');

      const lifetimePurchaseByUserIdCacheObj = new LifetimePurchaseByUserIdsCache({ userIds: [params.userId] });
      promiseArray.push(lifetimePurchaseByUserIdCacheObj.clear());

      const userPendingTopupCacheObj = new UserPendingTopupCache({ userId: params.userId });
      promiseArray.push(userPendingTopupCacheObj.clear());
    }

    return Promise.all(promiseArray);
  }
}

module.exports = FiatPaymentModel;
