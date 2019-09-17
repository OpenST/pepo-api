const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserPaymentsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserPaymentsByIds'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  TransactionCache = require(rootPrefix + '/lib/cacheManagement/multi/TransactionByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GetTopup extends ServiceBase {
  /**
   * Constructor to fetch pending topups of user.
   *
   * @param {object} params
   * @param {Integer} [params.payment_id]
   * @param {Object} [params.current_user]  - current user
   * @param {string} [params.transaction_id]  - transaction id of apple or google.
   *
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.paymentId = params.payment_id;
    oThis.currentUserId = +params.current_user.id;
    oThis.gatewayReceiptId = params.transaction_id;

    oThis.topupDbRecord = null;
    oThis.transaction = null;
  }

  /**
   * Async Perform
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchPaymentDetail();

    await oThis._validateAccess();

    await oThis._fetchOstTransaction();

    return oThis._formatResponse();
  }

  /**
   * Fetch the topup record using the id
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchPaymentDetail() {
    const oThis = this;

    const cacheObj = new UserPaymentsByIdsCache({ ids: [oThis.paymentId] }),
      cacheResp = await cacheObj.fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.topupDbRecord = cacheResp.data[oThis.paymentId];
  }

  /**
   * Validate access
   *
   * @return {Promise<never>}
   * @private
   */
  async _validateAccess() {
    const oThis = this;

    // if receiptId is passed correctly, then no need to validate further. We assume that the receipt id is hard to guess.
    if (oThis.topupDbRecord.receiptId == oThis.gatewayReceiptId) return;

    // else we check that the topup user id is same as the current user.
    if (oThis.topupDbRecord.fromUserId != oThis.currentUserId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_gpd_1',
          api_error_identifier: 'resource_not_found',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: {
            userId: oThis.topupDbRecord.fromUserId,
            currentUserId: oThis.currentUserId,
            paymentId: oThis.paymentId
          }
        })
      );
    }
  }

  /**
   * Fetch Ost transactions
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchOstTransaction() {
    const oThis = this,
      txId = oThis.topupDbRecord.transactionId;

    if (txId) {
      let resp = await new TransactionCache({ ids: [txId] }).fetch();

      oThis.transaction = resp.data[txId];
    }
  }

  /**
   * Format response
   *
   * @private
   */
  _formatResponse() {
    const oThis = this;

    oThis.topupDbRecord['transactionUuid'] = oThis.transaction ? oThis.transaction.ostTxId : null;

    return responseHelper.successWithData({
      [entityType.topup]: oThis.topupDbRecord
    });
  }
}

module.exports = GetTopup;
