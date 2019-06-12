const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TokenUserByOstUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByOstUserIds'),
  TokenUserDetailByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  ExternalEntityModel = require(rootPrefix + '/app/models/mysql/ExternalEntity'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  tokenConstants = require(rootPrefix + '/lib/globalConstant/token'),
  externalEntityConstants = require(rootPrefix + '/lib/globalConstant/externalEntity'),
  ostPlatformSdk = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken');

class UserActivationSuccess extends ServiceBase {
  /**
   * @param {Object} params
   * @param {String} params.result_type: Result Type
   * @param {String} params.password: User
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.ostUser = params.data.user;

    oThis.ostUserid = oThis.ostUser.id;
    oThis.ostUserTokenHolderAddress = oThis.ostUser.token_holder_address.toLowerCase();
    oThis.ostUserStatus = oThis.ostUser.status.toUpperCase();

    oThis.tokenUserObj = null;
    oThis.tokenData = null;
    oThis.userId = null;
    oThis.airdropTxResp = null;
    oThis.airdropNotNeeded = false;
  }

  /**
   * perform - Validate Login Credentials
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchTokenUser();

    await oThis._updateTokenUser();

    await oThis._startAirdrop();

    if (oThis.airdropNotNeeded) {
      return Promise.resolve(responseHelper.successWithData({}));
    }

    await oThis._markTokenUserAirdropStartedProperty();

    await oThis._createExternalEntity();

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Validate Request
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Validate for user activation success');
    let paramErrors = [];

    if (!CommonValidators.validateEthAddress(oThis.ostUserTokenHolderAddress)) {
      paramErrors.push('invalid_token_holder_address');
    }

    if (oThis.ostUserStatus !== tokenUserConstants.activatedOstStatus) {
      paramErrors.push('invalid_status');
    }

    if (paramErrors.length > 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_oe_u_as_vas_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: paramErrors,
          debug_options: {}
        })
      );
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Validate Request
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    logger.log('Fetch Token User for user activation success');

    let tokenUserObjsRes = await new TokenUserByOstUserIdsCache({ ostUserIds: [oThis.ostUserid] }).fetch();
    let tokenUserObjRes = tokenUserObjsRes.data[oThis.ostUserid];

    if (!tokenUserObjRes.userId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_u_as_ftu_1',
          api_error_identifier: 'resource_not_found'
        })
      );
    }

    oThis.userId = tokenUserObjRes.userId;

    tokenUserObjsRes = await new TokenUserDetailByUserIdCache({ userIds: [oThis.userId] }).fetch();
    oThis.tokenUserObj = tokenUserObjsRes.data[oThis.userId];

    if (!oThis.tokenUserObj.id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_u_as_ftu_2',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    if (
      oThis.tokenUserObj.ostStatus === tokenUserConstants.activatedOstStatus &&
      oThis.tokenUserObj.ost_token_holder_address !== oThis.ostUserTokenHolderAddress
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_u_as_ftu_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: { tokenUserObj: tokenUserObj, ostUser: oThis.ostUser }
        })
      );
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Update Token User Properties
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _updateTokenUser() {
    const oThis = this;
    logger.log('Update Token User for user activation success');

    if (oThis.tokenUserObj.ostStatus === tokenUserConstants.activatedOstStatus) {
      return Promise.resolve(responseHelper.successWithData({}));
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

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Start Airdrop For User
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _startAirdrop() {
    const oThis = this;
    logger.log('Start Airdrop for user activation success');

    let propertyArr = new TokenUserModel().getBitwiseArray('properties', oThis.tokenUserObj.properties);

    if (propertyArr.indexOf(tokenUserConstants.airdropStartedProperty) > -1) {
      oThis.airdropNotNeeded = true;
      return Promise.resolve(responseHelper.successWithData({}));
    }

    await oThis._executeTransaction();

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Execute Transaction using OST sdk
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _executeTransaction() {
    const oThis = this;
    logger.log('Start executeTransaction on user activation success');

    let tokenData = await new SecureTokenCache().fetch();
    if (tokenData.isFailure()) {
      logger.error('Error while fetching token data');
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_u_as_et_1',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    oThis.tokenData = tokenData.data;

    const transferToAddress = oThis.tokenUserObj.ostTokenHolderAddress;
    let ruleAddresses = JSON.parse(oThis.tokenData.ruleAddresses);

    let executeParams = {
      user_id: oThis.tokenData.ostCompanyUserId,
      to: ruleAddresses['Direct Transfer'],
      meta_property: {
        details: 'Welcome',
        type: 'company_to_user',
        name: 'UserActivateAirdrop'
      },
      raw_calldata: JSON.stringify({
        method: 'directTransfers',
        parameters: [transferToAddress, tokenConstants.airdropAmount]
      })
    };

    let startAirdropResponse = null;
    try {
      startAirdropResponse = await ostPlatformSdk.executeTransaction(executeParams);
    } catch (err) {
      logger.error('Error in Activation airdrop OST Wrapper api call::->', err);
      return Promise.reject(err);
    }

    if (!startAirdropResponse.isSuccess()) {
      return Promise.reject(startAirdropResponse);
    }

    oThis.airdropTxResp = startAirdropResponse.data;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Mark Airdrop Started Property for Token USer
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _markTokenUserAirdropStartedProperty() {
    const oThis = this;
    logger.log('Mark Token User Airdrop Done Property');

    let propertyVal = oThis.tokenUserObj.properties;
    propertyVal = new TokenUserModel().setBitwise('properties', propertyVal, tokenUserConstants.airdropStartedProperty);

    if (propertyVal !== oThis.tokenUserObj.properties) {
      await new TokenUserModel()
        .update({
          properties: propertyVal
        })
        .where(['id = ?', oThis.tokenUserObj.id])
        .fire();

      await TokenUserModel.flushCache({ userId: oThis.tokenUserObj.userId });
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Create External Entitites record for airdrop
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _createExternalEntity() {
    const oThis = this;
    logger.log('Create External Entitites record for airdrop started');

    let extraData = {
      kind: externalEntityConstants.extraData.airdropKind,
      fromUserId: 0,
      toUserIds: [oThis.tokenUserObj.userId],
      amounts: [tokenConstants.airdropAmount],
      ostTransactionStatus: oThis.airdropTxResp.transaction.status.toUpperCase()
    };

    // Insert in database
    let insertResponse = await new ExternalEntityModel()
      .insert({
        entity_kind: externalEntityConstants.invertedEntityKinds[externalEntityConstants.ostTransactionEntityKind],
        entity_id: oThis.airdropTxResp.transaction.id,
        extra_data: JSON.stringify(extraData)
      })
      .fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in external_entities table');
      return Promise.reject(insertResponse);
    }

    await ExternalEntityModel.flushCache({ id: insertResponse.insertId });

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = UserActivationSuccess;
