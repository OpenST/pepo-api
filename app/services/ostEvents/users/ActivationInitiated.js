const rootPrefix = '../../../..',
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  UserOstEventBase = require(rootPrefix + '/app/services/ostEvents/users/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser');

/**
 * Class for user activation initiated webhook processor.
 *
 * @class UserActivationInitiated
 */
class UserActivationInitiated extends UserOstEventBase {
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

    if (oThis.tokenUserObj.ostStatus === tokenUserConstants.activatingOstStatus) {
      // At this point, status of tokenUser would be createdOstStatus.
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_u_ai_ftu_2',
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

    logger.log('Updating token user to user activating.');

    await new TokenUserModel()
      .update({
        ost_status: tokenUserConstants.invertedOstStatuses[oThis.ostUserStatus]
      })
      .where({ id: oThis.tokenUserObj.id })
      .fire();

    await TokenUserModel.flushCache({ userId: oThis.tokenUserObj.userId });

    return responseHelper.successWithData({});
  }
}

module.exports = UserActivationInitiated;
