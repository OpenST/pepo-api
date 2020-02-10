const rootPrefix = '../..',
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/fiat/FiatPayment'),
  FiatPaymentsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserPaymentsByIds'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiat/fiatPayment'),
  CompanyToUserTransaction = require(rootPrefix + '/lib/transaction/CompanyToUser'),
  TokenUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionTypesConstants = require(rootPrefix + '/lib/globalConstant/transactionTypes');

/**
 * Class for feed base.
 *
 * @class PostProcessPaymentReceipt
 */
class PostProcessPaymentReceipt {
  constructor(params) {
    const oThis = this;

    oThis.fiatPaymentId = params.fiatPaymentId;

    oThis.fiatPayment = null;
    oThis.userTokenHolderAddress = null;
    oThis.transactionId = null;
  }

  /**
   * Perform
   *
   * @return {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchFiatPayment();

    if (!oThis._isPepoTransactionNeeded()) return;

    await oThis._fetchTokenUserDetails();

    await oThis._executeTransaction();

    await oThis._flushFiatPaymentCache();
  }

  /**
   * Fetch fiat payment record
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchFiatPayment() {
    const oThis = this;

    let fiatPayments = await new FiatPaymentsByIdsCache({ ids: [oThis.fiatPaymentId] }).fetch();

    if (fiatPayments.isFailure()) {
      return Promise.reject(fiatPayments);
    }

    oThis.fiatPayment = fiatPayments.data[oThis.fiatPaymentId];
  }

  /**
   * Is pepo tx already initiated
   *
   * @return {boolean}
   * @private
   */
  _isPepoTransactionNeeded() {
    const oThis = this;

    // if pepo transaction id present, then return false
    if (oThis.fiatPayment.transactionId) return false;

    return oThis.fiatPayment.status == fiatPaymentConstants.receiptValidationSuccessStatus;
  }

  /**
   * Fetch token user details.
   *
   * @sets oThis.userTokenHolderAddress
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTokenUserDetails() {
    const oThis = this;

    const userId = oThis.fiatPayment.fromUserId;

    const cacheResponse = await new TokenUserByUserIdsCache({ userIds: [userId] }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.userTokenHolderAddress = cacheResponse.data[userId].ostTokenHolderAddress;
  }

  /**
   * Execute transaction and create entry in transactions table.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _executeTransaction() {
    const oThis = this;

    const executePayTransactionParams = {
      transferToAddress: oThis.userTokenHolderAddress,
      transferToUserId: oThis.fiatPayment.fromUserId,
      amountInWei: oThis.fiatPayment.pepoAmountInWei,
      transactionKind: fiatPaymentConstants.topUpKind,
      fiatPaymentId: oThis.fiatPaymentId,
      transactionMetaProperties: {
        name: transactionConstants.topUpKind,
        type: transactionTypesConstants.companyToUserTransactionType,
        details: 'PEPO Recharge'
      }
    };

    // Todo Payments : use this in airdrop code too
    const executionResponse = await new CompanyToUserTransaction(executePayTransactionParams).perform();

    if (executionResponse.isFailure()) {
      await oThis._markFiatPaymentFailed();

      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_p_ppr_1',
        api_error_identifier: 'could_not_proceed',
        debug_options: {
          message: 'URGENT :: Topup of pepo could not be started after successful payment.',
          fiatPaymentId: oThis.fiatPaymentId,
          executionResponse: JSON.stringify(executionResponse),
          executePayTransactionParams: JSON.stringify(executePayTransactionParams)
        }
      });
      logger.error('Topup of pepo could not be started after successful payment.', errorObject);
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    } else {
      await oThis._updateFiatPayment(executionResponse.data.transactionId);
    }

    return responseHelper.successWithData({});
  }

  _flushFiatPaymentCache() {
    const oThis = this;

    return FiatPaymentModel.flushCache({
      fiatPaymentId: oThis.fiatPaymentId,
      userId: oThis.fiatPayment.fromUserId
    });
  }

  /**
   * Update fiat payments
   *
   * @param transactionId
   * @return {Promise<*|result>}
   * @private
   */
  async _updateFiatPayment(transactionId) {
    const oThis = this;

    if (transactionId) {
      await new FiatPaymentModel()
        .update({ transaction_id: transactionId })
        .where({ id: oThis.fiatPaymentId })
        .fire();
    }

    return responseHelper.successWithData({});
  }

  /**
   * Mark fiat payment failed
   *
   * @return {Promise<*|result>}
   * @private
   */
  async _markFiatPaymentFailed() {
    const oThis = this;

    await new FiatPaymentModel()
      .update({
        status: fiatPaymentConstants.invertedStatuses[fiatPaymentConstants.pepoTransferFailedStatus]
      })
      .where({ id: oThis.fiatPaymentId })
      .fire();

    return responseHelper.successWithData({});
  }
}

module.exports = PostProcessPaymentReceipt;
