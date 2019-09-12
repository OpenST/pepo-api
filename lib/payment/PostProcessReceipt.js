const rootPrefix = '../..',
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  CompanyToUserTransaction = require(rootPrefix + '/lib/transaction/CompanyToUser'),
  TokenUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

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

  async perform() {
    const oThis = this;

    let fiatPayments = await new FiatPaymentModel().fetchByIds([oThis.fiatPaymentId]);
    oThis.fiatPayment = fiatPayments[oThis.fiatPaymentId];

    if (
      oThis.fiatPayment.status == fiatPaymentConstants.receiptValidationSuccessStatus &&
      !oThis.fiatPayment.transactionId
    ) {
      await oThis._fetchTokenUserDetails();

      await oThis._executeTransaction();

      await FiatPaymentModel.flushCache(oThis.fiatPaymentId);
    }

    return responseHelper.successWithData({});
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
      amountInWei: basicHelper.convertToLowerUnit(oThis.fiatPayment.pepoAmount, 18),
      transactionKind: fiatPaymentConstants.topUpKind,
      fiatPaymentId: oThis.fiatPaymentId,
      transactionMetaProperties: {
        name: transactionConstants.extraData.topUpKind,
        type: 'company_to_user',
        details: 'PEPO Recharge'
      }
    };

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
