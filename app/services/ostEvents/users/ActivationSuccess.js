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
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

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

    oThis.resultType = params.result_type;
    oThis.ostUser = params.user;
    oThis.ostUserid = oThis.ostUser.id;

    oThis.tokenUserObj = null;
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

    if (!CommonValidators.validateEthAddress(oThis.ostUser.token_holder_address)) {
      paramErrors.push('invalid_token_holder_address');
    }

    if (oThis.ostUser.status.toUpperCase() !== tokenUserConstants.activatedOstStatus) {
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

    tokenUserObjRes = await new TokenUserDetailByUserIdCache({ userId: [oThis.userId] }).fetch();
    if (tokenUserObjRes.isFailure() || !tokenUserObjRes.data || !tokenUserObjRes.data[oThis.userId]) {
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
      oThis.tokenUserObj.ost_token_holder_address !== oThis.ostUser.token_holder_address.toLowerCase()
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
        ost_token_holder_address: oThis.ostUser.token_holder_address.toLowerCase(),
        properties: propertyVal,
        ost_status: oThis.ostUser.status.toUpperCase()
      })
      .where(['id = ?', oThis.tokenUserObj.id])
      .fire();

    await TokenUserModel.flushCache({ userId: oThis.tokenUserObj.userId });

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

    // const startAirdropResponse = await ostPlatformSdk.createUser();
    // if (!startAirdropResponse.isSuccess()) {
    //   return Promise.reject(startAirdropResponse);
    // }

    let propertyVal = oThis.tokenUserObj.properties;

    propertyVal = new TokenUserModel().setBitwise('properties', propertyVal, tokenUserConstants.airdropStartedProperty);

    await new TokenUserModel()
      .update({
        properties: propertyVal
      })
      .where(['id = ?', oThis.tokenUserObj.id])
      .fire();

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = UserActivationSuccess;
