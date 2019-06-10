'use strict';
/**
 * This service helps in processing the user activation success event from ost platform
 *
 * Note:-
 */

const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  TokenUserByOstUserIdCache = require(rootPrefix + '/lib/cacheManagement/TokenUserByOstUserId'),
  TokenUserDetailByUserIdCache = require(rootPrefix + '/lib/cacheMultiManagement/TokenUserDetailByUserIds'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  ostPlatformSdk = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  SecureTokenData = require(rootPrefix + '/lib/cacheManagement/secureTokenData');

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
    oThis.userAlreadyActive = false;
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

    let tokenUserObjRes = await new TokenUserByOstUserIdCache({ ostUserId: oThis.ostUserid }).fetch();

    if (tokenUserObjRes.isFailure() || !tokenUserObjRes.data.id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_u_as_ftu_1',
          api_error_identifier: 'resource_not_found'
        })
      );
    }

    oThis.userId = tokenUserObjRes.data.userId;

    tokenUserObjRes = await new TokenUserDetailByUserIdCache({ userIds: [oThis.userId] }).fetch();
    if (tokenUserObjRes.isFailure() || !tokenUserObjRes.data[oThis.userId].id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_u_as_ftu_2',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    oThis.tokenUserObj = tokenUserObjRes.data[oThis.userId];

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
      oThis.userAlreadyActive = true;
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
      return Promise.resolve(responseHelper.successWithData({}));
    }

    await oThis._executeTransaction();

    let propertyVal = oThis.tokenUserObj.properties;

    propertyVal = new TokenUserModel().setBitwise('properties', propertyVal, tokenUserConstants.airdropStartedProperty);

    await new TokenUserModel()
      .update({
        properties: propertyVal
      })
      .where(['id = ?', oThis.tokenUserObj.id])
      .fire();

    await TokenUserModel.flushCache({ userId: oThis.tokenUserObj.userId });

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

    let tokenData = await new SecureTokenData().fetch();
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

    const transferToAddresses = oThis.tokenData.ostTokenHolderAddress,
      transferAmount = '10000000000000000000'; //10 BT

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
        parameters: [transferToAddresses, transferAmount]
      })
    };

    try {
      const startAirdropResponse = await ostPlatformSdk.executeTransaction(executeParams);
      if (!startAirdropResponse.isSuccess()) {
        return Promise.reject(startAirdropResponse);
      }
    } catch (err) {
      logger.error('Error in Activation airdrop OST Wrapper api call::->', err);
      return Promise.reject(err);
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = UserActivationSuccess;
