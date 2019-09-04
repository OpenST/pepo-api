const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  TemporaryTokenModel = require(rootPrefix + '/app/models/mysql/TemporaryToken'),
  temporaryTokenConstant = require(rootPrefix + '/lib/globalConstant/temporaryToken');

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
    oThis.preLaunchInviteId = null;
    oThis.temporaryTokenObj = null;
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
    let decryptedT = localCipher.decrypt(coreConstants.PA_EMAIL_TOKENS_DECRIPTOR_KEY, oThis.t),
      splitedT = decryptedT.split(':');

    if (splitedT.length > 2) {
      return oThis._invalidUrlError('a_s_do_1');
    }

    oThis.token = splitedT[1];
    oThis.preLaunchInviteId = parseInt(splitedT[0]);
  }

  /**
   * Fetch pre launch invite double opt in token
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchPreLaunchInviteDoubleOptInToken() {
    const oThis = this;

    oThis.temporaryTokenObj = await new TemporaryTokenModel().fetchById(oThis.preLaunchInviteId);

    if (!oThis.temporaryTokenObj.token) {
      logger.error('Error while fetching data from temporary_tokens table.');
      return Promise.reject(new Error('Error while fetching data from temporary_tokens table.'));
    }

    if (oThis.temporaryTokenObj.token !== oThis.token) {
      return oThis._invalidUrlError('a_s_do_2');
    }

    if (oThis.temporaryTokenObj.status !== temporaryTokenConstant.activeStatus) {
      return oThis._invalidUrlError('a_s_do_3');
    }

    if (oThis.temporaryTokenObj.kind !== temporaryTokenConstant.preLaunchInviteKind) {
      return oThis._invalidUrlError('a_s_do_4');
    }
  }

  /**
   * Create double opt in token
   *
   * @returns {Promise<never>}
   * @private
   */
  async _markTokenAsUsed() {
    const oThis = this;

    await new TemporaryTokenModel()
      .update({ status: temporaryTokenConstant.invertedStatuses[temporaryTokenConstant.usedStatus] })
      .where({ id: oThis.preLaunchInviteId })
      .fire();

    await new TemporaryTokenModel()
      .update({ status: temporaryTokenConstant.invertedStatuses[temporaryTokenConstant.inActiveStatus] })
      .where({
        entity_id: oThis.temporaryTokenObj.entityId,
        kind: temporaryTokenConstant.invertedKinds[temporaryTokenConstant.preLaunchInviteKind],
        status: temporaryTokenConstant.invertedStatuses[temporaryTokenConstant.activeStatus]
      })
      .fire();
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
        api_error_identifier: 'invalid_url',
        debug_options: {}
      })
    );
  }
}

module.exports = SendDoubleOptIn;
