/**
 * This module helps to fetch pending topups request of user.
 * @module app/services/user/GetPaymentDetails
 */
const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserPaymentsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserPaymentsByIds'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  TransactionCache = require(rootPrefix + '/lib/cacheManagement/multi/TransactionByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to fetch pending topups of user.
 *
 * @class GetPaymentDetails
 */
class GetPaymentDetails extends ServiceBase {
  /**
   * Constructor to fetch pending topups of user.
   *
   * @param {object} params
   * @param {Integer} [params.payment_id]
   * @param {Object} [params.current_user]  - current user
   *
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.paymentId = params.payment_id;
    oThis.currentUserId = params.current_user.id;

    oThis.paymentDetails = null;
    oThis.transactionsMap = {};
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

    if (oThis.paymentDetails.fromUserId !== oThis.currentUserId) {
      return responseHelper.paramValidationError({
        internal_error_identifier: 'a_s_u_gpd_1',
        api_error_identifier: 'resource_not_found',
        params_error_identifiers: ['invalid_user_id'],
        debug_options: {
          userId: oThis.paymentDetails.fromUserId,
          currentUserId: oThis.currentUserId,
          paymentId: oThis.paymentId
        }
      });
    }

    await oThis._fetchOstTransactions();

    return oThis._formatResponse();
  }

  /**
   * Fetch Pending top ups of user
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

    oThis.paymentDetails = cacheResp.data[oThis.paymentId];
  }

  /**
   * Fetch Ost transactions
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchOstTransactions() {
    const oThis = this,
      txId = oThis.paymentDetails.transactionId;

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

    oThis.paymentDetails['transactionUuid'] = oThis.transaction ? oThis.transaction.ostTxId : null;

    return responseHelper.successWithData({
      [entityType.userTopUp]: oThis.paymentDetails
    });
  }
}

module.exports = GetPaymentDetails;
