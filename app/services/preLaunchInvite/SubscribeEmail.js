const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  SendDoubleOptInService = require(rootPrefix + '/app/services/SendDoubleOptIn'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for subscribe email.
 *
 * @class SubscribeEmail
 */
class SubscribeEmail extends ServiceBase {
  /**
   * Constructor for subscribe email.
   *
   * @param {object} params
   * @param {string} params.email: email
   * @param {string} params.current_pre_launch_invite: current pre launch invite
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.email = params.email;
    oThis.securePreLaunchInviteObj = params.current_pre_launch_invite;

    oThis.preLaunchInviteObj = null;
  }

  /**
   * Perform: Perform user creation.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validate();

    await oThis._sendDoubleOptIn();

    if (oThis.email !== oThis.preLaunchInviteObj.email) {
      await oThis._updateEmail();
    }

    await oThis._updateStatus();

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Validate
   *
   * @return {Promise<Result>}
   * @private
   */
  async _validate() {
    const oThis = this;

    await oThis._validateEmail();
    return oThis._fetchAndValidatePreLaunchInvite();
  }

  /**
   * Validate email
   *
   * @returns {Promise<never>}
   * @private
   */
  _validateEmail() {
    const oThis = this;

    if (CommonValidators.isVarNullOrUndefined(oThis.email) || !CommonValidators.isValidEmail(oThis.email)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_pli_se_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_email'],
          debug_options: { email: oThis.email }
        })
      );
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch and validate pre launch invite
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchAndValidatePreLaunchInvite() {
    const oThis = this;

    oThis.preLaunchInviteObj = await new PreLaunchInviteModel().fetchById(oThis.securePreLaunchInviteObj.id);

    if (oThis.preLaunchInviteObj.status === preLaunchInviteConstants.doptinStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_pli_se_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['email_already_doptin'],
          debug_options: { email: oThis.email }
        })
      );
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Send double opt in
   *
   * @returns {Promise<*>}
   * @private
   */
  async _sendDoubleOptIn() {
    const oThis = this;

    let sendDoubleOptInParams = {
      pre_launch_invite_hook: oThis.preLaunchInviteObj
    };

    await new SendDoubleOptInService(sendDoubleOptInParams).perform();
  }

  /**
   * Update email
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateEmail() {
    const oThis = this;

    await new PreLaunchInviteModel()
      .update({ email: oThis.email })
      .where({ id: oThis.preLaunchInviteObj.id })
      .fire();
  }

  /**
   * Update status
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateStatus() {
    const oThis = this;

    let doptinStatus = preLaunchInviteConstants.invertedStatuses[preLaunchInviteConstants.doptinStatus];
    await new PreLaunchInviteModel()
      .update({ status: doptinStatus })
      .where({ id: oThis.preLaunchInviteObj.id })
      .fire();
  }
}

module.exports = SubscribeEmail;
