const rootPrefix = '../../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  UserOstEventBase = require(rootPrefix + '/app/services/ostEvents/users/Base'),
  CompanyToUserTransaction = require(rootPrefix + '/lib/transaction/CompanyToUser'),
  PricePointsCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  tokenConstants = require(rootPrefix + '/lib/globalConstant/token'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  ostPricePointsConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints'),
  transactionTypesConstants = require(rootPrefix + '/lib/globalConstant/transactionTypes');

/**
 * Class for user activation success.
 *
 * @class UserActivationSuccess
 */
class UserActivationSuccess extends UserOstEventBase {
  /**
   * Constructor for user activation success.
   *
   * @param {object} params
   *
   * @augments UserOstEventBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.tokenUserObj = null;
    oThis.tokenData = null;
    oThis.userId = null;
    oThis.airdropTxResp = null;

    oThis.airdropAmountInWei = '0';
    oThis.pricePoints = {};
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchTokenUser();

    await oThis._updateTokenUser();

    await oThis._startAirdropAndCreateTransactionEntry();

    await oThis._markTokenUserAirdropStartedProperty();

    //await oThis._createTransactionEntry();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize params.
   *
   * @sets oThis.ostUserTokenHolderAddress
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    oThis.ostUserTokenHolderAddress = oThis.ostUserTokenHolderAddress.toLowerCase();

    await super._validateAndSanitizeParams();

    if (!CommonValidators.validateEthAddress(oThis.ostUserTokenHolderAddress)) {
      oThis.paramErrors.push('invalid_token_holder_address');
    }

    if (oThis.ostUserStatus !== tokenUserConstants.activatedOstStatus) {
      oThis.paramErrors.push('invalid_status');
    }

    if (oThis.paramErrors.length > 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_oe_u_as_vas_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: oThis.paramErrors,
          debug_options: {}
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch token user.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    const rsp = await super._fetchTokenUser();

    if (rsp.isFailure()) {
      return rsp;
    }

    if (
      oThis.tokenUserObj.ostStatus === tokenUserConstants.activatedOstStatus &&
      oThis.tokenUserObj.ostTokenHolderAddress !== oThis.ostUserTokenHolderAddress
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_u_as_ftu_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { tokenUserObj: oThis.tokenUserObj, ostUser: oThis.ostUser }
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Update token user properties.
   *
   * @return {Promise<void>}
   * @private
   */
  async _updateTokenUser() {
    const oThis = this;

    logger.log('Updating token user for user activation success.');

    if (oThis.tokenUserObj.ostStatus === tokenUserConstants.activatedOstStatus) {
      return responseHelper.successWithData({});
    }

    let propertyVal = oThis.tokenUserObj.properties;

    propertyVal = new TokenUserModel().setBitwise(
      'properties',
      propertyVal,
      tokenUserConstants.tokenHolderDeployedProperty
    );

    await new TokenUserModel()
      .update({
        ost_token_holder_address: oThis.ostUserTokenHolderAddress,
        properties: propertyVal,
        ost_status: tokenUserConstants.invertedOstStatuses[oThis.ostUserStatus]
      })
      .where(['id = ?', oThis.tokenUserObj.id])
      .fire();

    await TokenUserModel.flushCache({ userId: oThis.tokenUserObj.userId });

    oThis.tokenUserObj.properties = propertyVal;
    oThis.tokenUserObj.ostTokenHolderAddress = oThis.ostUserTokenHolderAddress;
    oThis.tokenUserObj.ostStatus = oThis.ostUserStatus;

    return responseHelper.successWithData({});
  }

  /**
   * Start airdrop transaction for user using OST sdk.
   *
   * @sets oThis.airdropAmountInWei
   *
   * @return {Promise<void>}
   * @private
   */
  async _startAirdropAndCreateTransactionEntry() {
    const oThis = this;

    logger.log('Starting airdrop for user.');

    await oThis._fetchPricePoints();

    const usdInOneOst =
      oThis.pricePoints[ostPricePointsConstants.stakeCurrency][ostPricePointsConstants.usdQuoteCurrency];

    oThis.airdropAmountInWei = tokenConstants.getPepoAirdropAmountInWei(usdInOneOst);

    const executePayTransactionParams = {
      transferToAddress: oThis.tokenUserObj.ostTokenHolderAddress,
      transferToUserId: oThis.tokenUserObj.userId,
      amountInWei: oThis.airdropAmountInWei,
      transactionKind: transactionConstants.airdropKind,
      transactionMetaProperties: {
        name: 'UserActivateAirdrop',
        type: transactionTypesConstants.companyToUserTransactionType,
        details: 'Welcome'
      }
    };

    logger.log('\n===companyToUserParams===', JSON.stringify(executePayTransactionParams));

    const executionResponse = await new CompanyToUserTransaction(executePayTransactionParams).perform();

    if (executionResponse.isFailure()) {
      return Promise.reject(executionResponse);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch price points.
   *
   * @sets oThis.pricePoints
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

    oThis.pricePoints = pricePointsCacheRsp.data;
  }

  /**
   * Mark airdrop started property for token user.
   *
   * @return {Promise<void>}
   * @private
   */
  async _markTokenUserAirdropStartedProperty() {
    const oThis = this;

    logger.log('Marking token user airdrop started property.');

    let propertyVal = oThis.tokenUserObj.properties;
    propertyVal = new TokenUserModel().setBitwise('properties', propertyVal, tokenUserConstants.airdropStartedProperty);

    if (propertyVal !== oThis.tokenUserObj.properties) {
      await new TokenUserModel()
        .update({
          properties: propertyVal
        })
        .where({ id: oThis.tokenUserObj.id })
        .fire();

      await TokenUserModel.flushCache({ userId: oThis.tokenUserObj.userId });
    }

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

    const extraData = {};

    const insertData = {
      ost_tx_id: oThis.airdropTxResp.transaction.id,
      from_user_id: 0,
      kind: transactionConstants.invertedKinds[transactionConstants.airdropKind],
      to_user_id: oThis.tokenUserObj.userId,
      amount: oThis.airdropAmountInWei,
      extra_data: JSON.stringify(extraData),
      status: transactionConstants.invertedStatuses[transactionConstants.pendingStatus]
    };

    const insertResponse = await new TransactionModel().insert(insertData).fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in transactions table.');

      return Promise.reject(insertResponse);
    }

    insertData.id = insertResponse.insertId;

    await TransactionModel.flushCache({ id: insertData.id, ostTxId: insertData.ost_tx_id });

    return responseHelper.successWithData({});
  }
}

module.exports = UserActivationSuccess;
