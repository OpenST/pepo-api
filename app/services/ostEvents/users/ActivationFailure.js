const rootPrefix = '../../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  UserOstEventBase = require(rootPrefix + '/app/services/ostEvents/users/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser');

class UserActivationFailure extends UserOstEventBase {
  /**
   * @param {Object} params
   *
   * @augments UserOstEventBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);
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

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize params.
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    await super._validateAndSanitizeParams();

    if (oThis.ostUserStatus !== tokenUserConstants.createdOstStatus) {
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
   *
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    await super._fetchTokenUser();

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
   *
   * @private
   */
  async _updateTokenUser() {
    const oThis = this;
    logger.log('Update Token User for user activation failure.');

    if (oThis.tokenUserObj.ostStatus === tokenUserConstants.createdOstStatus) {
      return Promise.resolve(responseHelper.successWithData({}));
    }

    let propertyVal = oThis.tokenUserObj.properties;

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

module.exports = UserActivationFailure;
