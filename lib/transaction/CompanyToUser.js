const rootPrefix = '../..',
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  ostPlatformSdk = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  PricePointsCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction');

class CompanyToUserTransaction {
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

  async perform() {
    const oThis = this;

    await oThis.getTokenData();

    await oThis._setPayDirectParams();

    await oThis._transferBt();

    return oThis._createTransactionEntry();
  }

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

  async _transferBt() {
    const oThis = this;

    logger.log('\n\n\n===executeParams===', JSON.stringify(oThis.executeParams));
    let startAirdropResponse = null;
    try {
      startAirdropResponse = await ostPlatformSdk.executeTransaction(oThis.executeParams);
    } catch (err) {
      logger.error('Error in topup airdrop OST Wrapper API call::->', err);

      return Promise.resolve(
        responseHelper.error({
          internal_error_identifier: 'l_t_ctu_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { error: err }
        })
      );
    }

    if (!startAirdropResponse.isSuccess()) {
      return Promise.resolve(startAirdropResponse);
    }

    oThis.airdropTxResp = startAirdropResponse.data;

    return responseHelper.successWithData({});
  }

  /**
   * Create airdrop transaction entry in transactions table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createTransactionEntry() {
    const oThis = this;

    logger.log('Creating entry in transactions table.');

    const extraData = {
      toUserIds: [oThis.transferToUserId],
      amounts: [oThis.amountBtInWei],
      kind: oThis.transactionKind
    };

    const insertData = {
      ost_tx_id: oThis.airdropTxResp.transaction.id,
      from_user_id: 0,
      extra_data: JSON.stringify(extraData),
      status: transactionConstants.invertedStatuses[transactionConstants.pendingStatus]
    };

    if (oThis.secondaryPaymentId) {
      insertData['secondary_payment_id'] = oThis.secondaryPaymentId;
    }
    const insertResponse = await new TransactionModel().insert(insertData).fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in transactions table.');

      return Promise.reject(insertResponse);
    }

    insertData.id = insertResponse.insertId;

    await TransactionModel.flushCache({ id: insertData.id, ostTxId: insertData.payment_id });

    return responseHelper.successWithData({ transactionId: insertData.id });
  }
}

module.exports = CompanyToUserTransaction;
