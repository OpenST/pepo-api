const rootPrefix = '../../..',
  OstTransactionBase = require(rootPrefix + '/app/services/ostTransaction/Base'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  ValidatePepocornTopUp = require(rootPrefix + '/app/services/pepocornTopUp/Validate'),
  PepocornTransactionModel = require(rootPrefix + '/app/models/mysql/redemption/PepocornTransaction'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  pepocornTransactionConstants = require(rootPrefix + '/lib/globalConstant/redemption/pepocornTransaction');

/**
 * Class to RedemptionTransaction.
 *
 * @class RedemptionTransaction
 */
class RedemptionTransaction extends OstTransactionBase {
  /**
   * Validate and sanitize.
   *
   * @sets oThis.videoId, oThis.pepocornAmount, oThis.productId, oThis.pepoUsdPricePoint, oThis.replyDetailId
   *
   * @private
   */
  _parseMetaProperty() {
    const oThis = this;

    const parsedMetaProperty = transactionConstants._parseTransactionMetaDetails(oThis.transaction.meta_property);

    oThis.pepocornAmount = parsedMetaProperty.pepocornAmount;
    oThis.productId = parsedMetaProperty.productId;
    oThis.pepoUsdPricePoint = parsedMetaProperty.pepoUsdPricePoint;
  }

  /**
   * This function is called when transaction is not found in transaction table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInTransactionAndAssociatedTables() {
    const oThis = this;

    // Insert in external entities, transactions and pending transactions.
    await oThis._validateTransactionData();

    const insertTransactionResponse = await oThis._insertTransaction();

    if (insertTransactionResponse.isDuplicateIndexViolation) {
      await oThis._fetchTransaction();
      if (!oThis.transactionId) {
        const errorObject = responseHelper.error({
          internal_error_identifier: 'a_s_ost_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { ostTxId: oThis.ostTxId }
        });
        await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

        return Promise.reject(errorObject);
      }
    } else {
      await oThis._insertInPepocornTransactions();
    }
  }

  /**
   * This function inserts data in external entities table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateTransactionData() {
    const oThis = this;

    const promiseArray = [oThis._validateToUserIdForRedemption(), oThis._validateTransactionDataForRedemption()];
    await Promise.all(promiseArray);
  }

  /**
   * This function validates to user ids and inserts in to user ids array. It also prepares amounts array.
   *
   * @sets oThis.toUserIdsArray, oThis.amountsArray
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateToUserIdForRedemption() {
    const oThis = this;

    if (oThis.transfersData.length !== 1) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_ost_vtui_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { transfersData: oThis.transfersData }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return Promise.reject(errorObject);
    }

    await oThis.getTokenData();

    if (oThis.transfersData[0].to_user_id.toLowerCase() !== oThis.tokenData.ostCompanyUserId.toLowerCase()) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_ost_vtui_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: { transfersData: oThis.transfersData }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return Promise.reject(errorObject);
    }

    oThis.toUserIdsArray.push(0); // Because company user id is considered 0 in the pepo system.
    oThis.amountsArray.push(oThis.transfersData[0].amount);
  }

  /**
   * Get token data.
   *
   * @sets oThis.tokenData
   *
   * @returns {Promise<*|result>}
   */
  async getTokenData() {
    const oThis = this;

    const tokenDataRsp = await new SecureTokenCache().fetch();
    if (tokenDataRsp.isFailure()) {
      logger.error('Error while fetching token data.');

      return Promise.reject(tokenDataRsp);
    }

    oThis.tokenData = tokenDataRsp.data;
  }

  /**
   * This function validates if the parameters are correct.
   *
   * @sets oThis.isValidRedemption
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateTransactionDataForRedemption() {
    const oThis = this;

    const validateParams = {
      request_timestamp: oThis.transaction.updated_timestamp,
      product_id: oThis.productId,
      pepo_amount_in_wei: oThis.transfersData[0].amount,
      pepocorn_amount: oThis.pepocornAmount,
      pepo_usd_price_point: oThis.pepoUsdPricePoint
    };

    oThis.isValidRedemption = false;

    const pepocornTopUpValidationResponse = await new ValidatePepocornTopUp(validateParams).perform();

    logger.log('pepocornTopUpValidationResponse ======', pepocornTopUpValidationResponse);
    if (pepocornTopUpValidationResponse.isFailure()) {
      await createErrorLogsEntry.perform(pepocornTopUpValidationResponse, errorLogsConstants.highSeverity);
    } else {
      oThis.isValidRedemption = true;
    }
  }

  /**
   * Insert in pepocorn transaction table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInPepocornTransactions() {
    const oThis = this;

    const status = oThis.isValidRedemption
      ? pepocornTransactionConstants.processingStatus
      : pepocornTransactionConstants.failedStatus;

    const insertData = {
      user_id: oThis.userId,
      kind: pepocornTransactionConstants.invertedKinds[pepocornTransactionConstants.creditKind],
      pepocorn_amount: oThis.pepocornAmount,
      transaction_id: oThis.transactionId,
      status: pepocornTransactionConstants.invertedStatuses[status]
    };

    const insertResponse = await new PepocornTransactionModel().insert(insertData).fire();

    insertData.id = insertResponse.insertId;

    const formattedInsertData = new PepocornTransactionModel().formatDbData(insertData);
    await PepocornTransactionModel.flushCache(formattedInsertData);
  }

  /**
   * Get extra data.
   *
   * @returns {Object}
   * @private
   */
  _getExtraData() {
    const oThis = this;

    return {};
  }

  /**
   * Get Transaction Kind
   *
   * @returns {Object}
   * @private
   */
  _transactionKind() {
    const oThis = this;

    return transactionConstants.redemptionKind;
  }
}

module.exports = RedemptionTransaction;
