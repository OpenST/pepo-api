const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  AddContactInPepoCampaign = require(rootPrefix + '/lib/email/hookCreator/AddContact'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite'),
  TemporaryTokenModel = require(rootPrefix + '/app/models/mysql/TemporaryToken'),
  temporaryTokenConstant = require(rootPrefix + '/lib/globalConstant/temporaryToken'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook');

class SendDoubleOptIn extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   *
   * @param {string} params.t
   *
   */
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.t = params.t;

    oThis.token = null;
    oThis.temporaryTokenId = null;
    oThis.temporaryTokenObj = null;
    oThis.tokenCreationTimestamp = null;
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validate();

    await oThis._fetchPreLaunchInviteDoubleOptInToken();

    await oThis._markPreLaunchInviteAsDoubleOptIn();

    await oThis._addContactInPepoCampaign();

    await oThis._markTokenAsUsed();

    return responseHelper.successWithData({});
  }

  /**
   * Validate token
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validate() {
    const oThis = this;
    let splitedT = [];

    try {
      let decryptedT = localCipher.decrypt(coreConstants.PA_EMAIL_TOKENS_DECRIPTOR_KEY, oThis.t);
      splitedT = decryptedT.split(':');
    } catch (error) {
      return oThis._invalidUrlError('a_s_do_v_1');
    }

    if (splitedT.length !== 2) {
      return oThis._invalidUrlError('a_s_do_v_2');
    }

    oThis.token = splitedT[1];
    oThis.temporaryTokenId = parseInt(splitedT[0]);
  }

  /**
   * Fetch pre launch invite double opt in token
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchPreLaunchInviteDoubleOptInToken() {
    const oThis = this;

    oThis.temporaryTokenObj = await new TemporaryTokenModel().fetchById(oThis.temporaryTokenId);

    if (!oThis.temporaryTokenObj.token) {
      return oThis._invalidUrlError('a_s_do_fpiot_1');
    }

    if (oThis.temporaryTokenObj.token !== oThis.token) {
      return oThis._invalidUrlError('a_s_do_fpiot_2');
    }

    if (oThis.temporaryTokenObj.status !== temporaryTokenConstant.activeStatus) {
      return oThis._invalidUrlError('a_s_do_fpiot_3');
    }

    if (oThis.temporaryTokenObj.kind !== temporaryTokenConstant.preLaunchInviteKind) {
      return oThis._invalidUrlError('a_s_do_fpiot_4');
    }

    if (
      Math.floor(Date.now() / 1000) - temporaryTokenConstant.tokenExpiryTimestamp >
      oThis.temporaryTokenObj.createdAt
    ) {
      return oThis._invalidUrlError('a_s_do_fpiot_5');
    }
  }

  /**
   * Mark token as used
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markTokenAsUsed() {
    const oThis = this;

    await new TemporaryTokenModel()
      .update({ status: temporaryTokenConstant.invertedStatuses[temporaryTokenConstant.usedStatus] })
      .where({ id: oThis.temporaryTokenId })
      .fire();
  }

  /**
   * Mark pre launch invite as double opt in
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markPreLaunchInviteAsDoubleOptIn() {
    const oThis = this;

    await new PreLaunchInviteModel()
      .update({ status: preLaunchInviteConstants.invertedStatuses[preLaunchInviteConstants.doptinStatus] })
      .where({ id: oThis.temporaryTokenObj.entityId })
      .fire();

    await PreLaunchInviteModel.flushCache({ id: oThis.temporaryTokenObj.entityId });
  }

  /**
   * Add contact in pepo campaign
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addContactInPepoCampaign() {
    const oThis = this;

    let addContactParams = {
      receiverEntityId: oThis.temporaryTokenObj.entityId,
      receiverEntityKind: emailServiceApiCallHookConstants.preLaunchInviteEntityKind,
      customDescription: 'Contact add for pre launch invite',
      customAttributes: {
        [emailServiceApiCallHookConstants.preLaunchAttribute]: 1
      }
    };

    await new AddContactInPepoCampaign(addContactParams).perform();
  }

  /**
   * Invalid url error
   *
   * @param code
   * @returns {Promise<never>}
   * @private
   */
  async _invalidUrlError(code) {
    const oThis = this;

    return Promise.reject(
      responseHelper.error({
        internal_error_identifier: code,
        api_error_identifier: 'invalid_api_params',
        debug_options: {}
      })
    );
  }
}

module.exports = SendDoubleOptIn;
