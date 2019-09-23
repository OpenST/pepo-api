const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TransactionCache = require(rootPrefix + '/lib/cacheManagement/multi/TransactionByIds'),
  UserPaymentsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserPaymentsByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType');

/**
 * Class to fetch pending topups of user.
 *
 * @class GetTopup
 */
class GetTopup extends ServiceBase {
  /**
   * Constructor to fetch pending topups of user.
   *
   * @param {object} params
   * @param {number} [params.payment_id]
   * @param {object} [params.current_user]: current user
   * @param {string} [params.transaction_id]: transaction id of apple or google.
   *
   * @augments ServiceBase
   *
   * @constructor
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
   * Async perform.
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
   * Fetch the topup record using the id.
   *
   * @sets oThis.topupDbRecord
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

    if (!CommonValidators.validateNonEmptyObject(oThis.topupDbRecord)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_tu_g_1',
          api_error_identifier: 'resource_not_found',
          params_error_identifiers: ['invalid_payment_id'],
          debug_options: {
            topupDbRecord: oThis.topupDbRecord,
            currentUserId: oThis.currentUserId,
            paymentId: oThis.paymentId
          }
        })
      );
    }
  }

  /**
   * Validate access.
   *
   * @return {Promise<*>}
   * @private
   */
  async _validateAccess() {
    const oThis = this;

    // If receiptId is passed correctly, then no need to validate further. We assume that the receipt id is hard to guess.
    if (oThis.topupDbRecord.receiptId == oThis.gatewayReceiptId) {
      return;
    }

    // Else we check that the topup user id is same as the current user.
    if (oThis.topupDbRecord.fromUserId != oThis.currentUserId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_tu_g_2',
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
   * Fetch ost transactions.
   *
   * @sets oThis.transaction
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchOstTransaction() {
    const oThis = this;

    const txId = oThis.topupDbRecord.transactionId;

    if (txId) {
      const resp = await new TransactionCache({ ids: [txId] }).fetch();

      oThis.transaction = resp.data[txId];
    }
  }

  /**
   * Format response.
   *
   * @returns {*|result}
   * @private
   */
  _formatResponse() {
    const oThis = this;

    oThis.topupDbRecord.transactionUuid = oThis.transaction ? oThis.transaction.ostTxId : null;

    return responseHelper.successWithData({
      [entityTypeConstants.topup]: oThis.topupDbRecord
    });
  }
}

module.exports = GetTopup;
