const rootPrefix = '../..',
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  ostPlatformSdk = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  PricePointsCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction');

/**
 * Class for CompanyToUserTransaction.
 *
 * @class Base64Helper
 */
class CompanyToUserTransaction {
  /**
   * CompanyToUserTransaction Constructor.
   *
   * @param params
   */
  constructor(params) {
    const oThis = this;

    oThis.transferToAddress = params.transferToAddress;
    oThis.transferToUserId = params.transferToUserId;
    oThis.amountBtInWei = params.amountInWei;

    oThis.transactionKind = params.transactionKind;
    oThis.fiatPaymentId = params.fiatPaymentId;
    oThis.transactionMetaProperties = params.transactionMetaProperties;

    oThis.tokenData = null;
    oThis.airdropTxResp = null;
    oThis.executeParams = null;
    oThis.amountFiatInWei = null;
  }

  /**
   * Perform
   *
   * @returns {Promise<unknown>}
   */
  async perform() {
    const oThis = this;

    await oThis.getTokenData();

    await oThis._setPayDirectParams();

    let transferResponse = await oThis._transferBt();

    if (transferResponse.isFailure()) {
      return Promise.resolve(transferResponse);
    }

    return oThis._createTransactionEntry();
  }

  /**
   * Get token data
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

    return responseHelper.successWithData({});
  }

  /**
   * set pay direct params
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _setPayDirectParams() {
    const oThis = this;

    logger.log('Starting airdrop for user.');

    const ruleAddresses = JSON.parse(oThis.tokenData.ruleAddresses);

    oThis.executeParams = {
      user_id: oThis.tokenData.ostCompanyUserId,
      to: ruleAddresses['Direct Transfer'],
      meta_property: oThis.transactionMetaProperties,
      raw_calldata: JSON.stringify({
        method: 'directTransfers',
        parameters: [[oThis.transferToAddress], [oThis.amountBtInWei]]
      })
    };

    return responseHelper.successWithData({});
  }

  /**
   * Fetch price points.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPricePoints() {
    const oThis = this;

    const pricePointsCacheRsp = await new PricePointsCache().fetch();

    if (pricePointsCacheRsp.isFailure()) {
      return Promise.reject(pricePointsCacheRsp);
    }

    return pricePointsCacheRsp.data;
  }

  /**
   * Transfer Bt
   *
   * @returns {Promise<unknown>}
   * @private
   */
  async _transferBt() {
    const oThis = this;

    logger.log('\n\n\n===executeParamss===', JSON.stringify(oThis.executeParams));
    let companyToUserTx = await ostPlatformSdk.executeTransaction(oThis.executeParams).catch(async function(err) {
      logger.error('Error in company to user transaction OST Wrapper API call::->', err);
      return Promise.resolve(
        responseHelper.error({
          internal_error_identifier: 'l_t_ctu_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { error: err }
        })
      );
    });

    if (companyToUserTx.isFailure()) {
      return Promise.resolve(companyToUserTx);
    }
    oThis.airdropTxResp = companyToUserTx.data;

    return responseHelper.successWithData({});
  }

  /**
   * Create transaction entry in transactions table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createTransactionEntry() {
    const oThis = this;

    logger.log('Creating entry in transactions table.');

    const extraData = {};

    const insertData = {
      ost_tx_id: oThis.airdropTxResp.transaction.id,
      from_user_id: 0,
      kind: transactionConstants.invertedKinds[oThis.transactionKind],
      to_user_id: oThis.transferToUserId,
      amount: oThis.amountBtInWei,
      status: transactionConstants.invertedStatuses[transactionConstants.pendingStatus]
    };

    if (oThis.fiatPaymentId) {
      extraData['fiatPaymentId'] = oThis.fiatPaymentId;
    }

    insertData['extra_data'] = JSON.stringify(extraData);

    const insertResponse = await new TransactionModel()
      .insert(insertData)
      .fire()
      .catch(async function(err) {
        logger.error('Transaction was successful. However there was an error while inserting the transaction in db.');
        let errorObject = responseHelper.error({
          internal_error_identifier: 'l_t_ctu_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { error: err }
        });

        await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);
      });

    if (!insertResponse) {
      logger.error('Error while inserting data in transactions table.');

      return Promise.resolve(
        responseHelper.error({
          internal_error_identifier: 'l_t_ctu_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: { error: insertResponse }
        })
      );
    }

    insertData.id = insertResponse.insertId;

    await TransactionModel.flushCache({ id: insertData.id, ostTxId: insertData.payment_id });

    return responseHelper.successWithData({ transactionId: insertData.id });
  }
}

module.exports = CompanyToUserTransaction;
