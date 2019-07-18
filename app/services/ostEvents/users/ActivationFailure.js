const rootPrefix = '../../../..',
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  UserOstEventBase = require(rootPrefix + '/app/services/ostEvents/users/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser');

/**
 * Class for user activation failure webhook processor.
 *
 * @class UserActivationFailure
 */
class UserActivationFailure extends UserOstEventBase {
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

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize params.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    await super._validateAndSanitizeParams();

    if (oThis.ostUserStatus !== tokenUserConstants.createdOstStatus) {
      // OST rolls back the status to CREATED in case of failure.
      oThis.paramErrors.push('invalid_status');
    }

    if (oThis.paramErrors.length > 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_oe_u_af_vas_1',
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

    await super._fetchTokenUser();

    // This is an extra check just to be sure that the status is definitely not activated.
    if (oThis.tokenUserObj.ostStatus === tokenUserConstants.activatedOstStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_u_af_ftu_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { tokenUserObj: oThis.tokenUserObj, ostUser: oThis.ostUser }
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Update token user status.
   *
   * @return {Promise<void>}
   * @private
   */
  async _updateTokenUser() {
    const oThis = this;

    logger.log('Updating token user for user activation failure.');

    // This is an extra check to avoid updating status in case of multiple webhooks being received.
    if (oThis.tokenUserObj.ostStatus === tokenUserConstants.createdOstStatus) {
      return responseHelper.successWithData({});
    }

    await new TokenUserModel()
      .update({
        ost_status: tokenUserConstants.invertedOstStatuses[oThis.ostUserStatus]
      })
      .where(['id = ?', oThis.tokenUserObj.id])
      .fire();

    await TokenUserModel.flushCache({ userId: oThis.tokenUserObj.userId });

    return responseHelper.successWithData({});
  }
}

module.exports = UserActivationFailure;
