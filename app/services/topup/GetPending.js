const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TransactionCache = require(rootPrefix + '/lib/cacheManagement/multi/TransactionByIds'),
  UserPendingTopupCache = require(rootPrefix + '/lib/cacheManagement/single/UserPendingTopups'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType');

class GetPendingTopup extends ServiceBase {
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
    oThis.currentUserId = +params.current_user.id;

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

    const cacheObj = new UserPendingTopupCache({ userId: oThis.currentUserId }),
      cacheResp = await cacheObj.fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.pendingTopUps = cacheResp.data[oThis.currentUserId] || [];
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
      [entityTypeConstants.topupList]: response
    });
  }
}

module.exports = GetPendingTopup;
