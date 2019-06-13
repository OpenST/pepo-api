const rootPrefix = '../../../..',
  UserOstEventBase = require(rootPrefix + '/app/services/ostEvents/users/Base'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class UserActivationInitiated extends UserOstEventBase {
  /**
   * @param params
   */
  constructor(params) {
    super(params);
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

    await super._validateAndSanitizeParams();

    if (oThis.ostUserStatus !== tokenUserConstants.activatingOstStatus) {
      oThis.paramErrors.push('invalid_status');
    }

    if (oThis.paramErrors.length > 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_oe_u_ai_vas_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: oThis.paramErrors,
          debug_options: {}
        })
      );
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch token user
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    const rsp = await super._fetchTokenUser();

    if (rsp.isFailure()) {
      return rsp;
    }

    if (oThis.tokenUserObj.ostStatus === tokenUserConstants.activatingOstStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_u_ai_ftu_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { tokenUserObj: oThis.tokenUserObj, ostUser: oThis.ostUser }
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
    logger.log('Update Token User for user activating success');

    if (oThis.tokenUserObj.ostStatus === tokenUserConstants.activatingOstStatus) {
      return Promise.resolve(responseHelper.successWithData({}));
    }

    await new TokenUserModel()
      .update({
        ost_status: tokenUserConstants.invertedOstStatuses[oThis.ostUserStatus]
      })
      .where(['id = ?', oThis.tokenUserObj.id])
      .fire();

    await TokenUserModel.flushCache({ userId: oThis.tokenUserObj.userId });

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = UserActivationInitiated;
