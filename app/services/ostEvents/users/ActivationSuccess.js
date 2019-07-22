const rootPrefix = '../../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  UserOstEventBase = require(rootPrefix + '/app/services/ostEvents/users/Base'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  tokenConstants = require(rootPrefix + '/lib/globalConstant/token'),
  ostPlatformSdk = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction');

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

    await oThis._startAirdrop();

    await oThis._markTokenUserAirdropStartedProperty();

    await oThis._createTransactionEntry();

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
      oThis.tokenUserObj.ost_token_holder_address !== oThis.ostUserTokenHolderAddress
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
   * @sets oThis.tokenData, oThis.airdropTxResp
   *
   * @return {Promise<void>}
   * @private
   */
  async _startAirdrop() {
    const oThis = this;

    logger.log('Starting airdrop for user.');

    const tokenDataRsp = await new SecureTokenCache().fetch();

    if (tokenDataRsp.isFailure()) {
      logger.error('Error while fetching token data.');

      return Promise.reject(tokenDataRsp);
    }

    oThis.tokenData = tokenDataRsp.data;

    const transferToAddress = oThis.tokenUserObj.ostTokenHolderAddress;
    const ruleAddresses = JSON.parse(oThis.tokenData.ruleAddresses);

    const executeParams = {
      user_id: oThis.tokenData.ostCompanyUserId,
      to: ruleAddresses['Direct Transfer'],
      meta_property: {
        details: 'Welcome',
        type: 'company_to_user',
        name: 'UserActivateAirdrop'
      },
      raw_calldata: JSON.stringify({
        method: 'directTransfers',
        parameters: [[transferToAddress], [tokenConstants.airdropAmount]]
      })
    };

    logger.log('\n\n\n===executeParams===', JSON.stringify(executeParams));
    let startAirdropResponse = null;
    try {
      startAirdropResponse = await ostPlatformSdk.executeTransaction(executeParams);
    } catch (err) {
      logger.error('Error in Activation airdrop OST Wrapper API call::->', err);

      return Promise.reject(err);
    }

    if (!startAirdropResponse.isSuccess()) {
      return Promise.reject(startAirdropResponse);
    }

    oThis.airdropTxResp = startAirdropResponse.data;

    return responseHelper.successWithData({});
  }

  /**
   * Mark airdrop started property for token user.
   *
   * @return {Promise<void>}
   * @private
   */
  async _markTokenUserAirdropStartedProperty() {
    const oThis = this;

    logger.log('Marking token user airdrop done property.');

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

    const extraData = {
      toUserIds: [oThis.tokenUserObj.ostTokenHolderAddress],
      amounts: [tokenConstants.airdropAmount],
      kind: transactionConstants.extraData.airdropKind
    };

    const insertData = {
      ost_tx_id: oThis.airdropTxResp.transaction.id,
      from_user_id: 0,
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
