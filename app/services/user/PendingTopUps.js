/**
 * This module helps to fetch pending topups request of user.
 * @module app/services/user/PendingTopUps
 */
const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserPendingTopupCache = require(rootPrefix + '/lib/cacheManagement/single/UserPendingTopups'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  TransactionCache = require(rootPrefix + '/lib/cacheManagement/multi/TransactionByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to fetch pending topups of user.
 *
 * @class PendingTopUps
 */
class PendingTopUps extends ServiceBase {
  /**
   * Constructor to fetch pending topups of user.
   *
   * @param {object} params
   * @param {Integer} [params.user_id]
   * @param {Object} [params.current_user]  - current user
   *
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.userId = params.user_id;
    oThis.currentUserId = params.current_user.id;

    oThis.pendingTopUps = [];
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

    if (oThis.userId !== oThis.currentUserId) {
      return responseHelper.paramValidationError({
        internal_error_identifier: 'a_s_u_ptu_1',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['invalid_user_id'],
        debug_options: {
          userId: oThis.userId,
          currentUserId: oThis.currentUserId
        }
      });
    }

    await oThis._fetchPaymentDetail();

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

    const cacheObj = new UserPendingTopupCache({ userId: oThis.userId }),
      cacheResp = await cacheObj.fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.pendingTopUps = cacheResp.data[oThis.userId] || [];
  }

  /**
   * Fetch Ost transactions
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchOstTransactions() {
    const oThis = this;

    let transactionIds = [];
    for (let i = 0; i < oThis.pendingTopUps.length; i++) {
      if (oThis.pendingTopUps[i].transactionId) {
        transactionIds.push(oThis.pendingTopUps[i].transactionId);
      }
    }

    if (transactionIds.length > 0) {
      let resp = await new TransactionCache({ ids: transactionIds }).fetch();

      oThis.transactionsMap = resp.data;
    }
  }

  /**
   * Format response
   *
   * @private
   */
  _formatResponse() {
    const oThis = this;

    let response = [];

    for (let i = 0; i < oThis.pendingTopUps.length; i++) {
      let ptu = oThis.pendingTopUps[i],
        ostTxId = null;

      if (ptu.transactionId && oThis.transactionsMap[ptu.transactionId]) {
        ostTxId = oThis.transactionsMap[ptu.transactionId].ostTxId;
      }

      ptu['transactionUuid'] = ostTxId;
      response.push(ptu);
    }

    return responseHelper.successWithData({
      [entityType.userTopUpsList]: response
    });
  }
}

module.exports = PendingTopUps;
