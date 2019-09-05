const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  TemporaryTokenModel = require(rootPrefix + '/app/models/mysql/TemporaryToken'),
  temporaryTokenConstant = require(rootPrefix + '/lib/globalConstant/temporaryToken'),
  preLaunchInviteConstant = require(rootPrefix + '/lib/globalConstant/preLaunchInvite'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookCreator/SendTransactionalMail'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook');

class SendDoubleOptIn extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   *
   * @param {string} params.pre_launch_invite_hook
   *
   */
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.preLaunchInviteHook = params.pre_launch_invite_hook;
    oThis.doubleOptInToken = null;
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    if (oThis.preLaunchInviteHook.status === preLaunchInviteConstant.doptinStatus) {
      return responseHelper.successWithData({});
    }

    await oThis._createDoubleOptInToken();

    await oThis._sendPreLaunchInviteDoubleOptInMail();

    return responseHelper.successWithData({ uploadParamsMap: oThis.apiResponse });
  }

  /**
   * Create double opt in token
   *
   * @returns {Promise<never>}
   * @private
   */
  async _createDoubleOptInToken() {
    const oThis = this;
    let tokenString = `${oThis.preLaunchInviteHook.id}::${
        oThis.preLaunchInviteHook.email
      }::${Date.now()}::preLaunchInviteDoubleOptIn::${Math.random()}`,
      temporaryDoubleOptInToken = util.createMd5Digest(tokenString);

    let insertResponse = await new TemporaryTokenModel()
      .insert({
        entity_id: oThis.preLaunchInviteHook.id,
        kind: temporaryTokenConstant.invertedKinds[temporaryTokenConstant.preLaunchInviteKind],
        token: temporaryDoubleOptInToken,
        status: temporaryTokenConstant.invertedStatuses[temporaryTokenConstant.activeStatus]
      })
      .fire();

    if (!insertResponse) {
      logger.error('Error while inserting data into pre_launch_invites table.');
      return Promise.reject(new Error('Error while inserting data into pre_launch_invites table.'));
    }

    let doubleOptInTokenStr = `${insertResponse.insertId.toString()}:${temporaryDoubleOptInToken}:${Math.floor(
      Date.now() / 1000
    )}`;
    oThis.doubleOptInToken = localCipher.encrypt(coreConstants.PA_EMAIL_TOKENS_DECRIPTOR_KEY, doubleOptInTokenStr);
  }

  /**
   * Send pre launch invite double opt in mail.
   *
   * @sets oThis.workingMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendPreLaunchInviteDoubleOptInMail() {
    const oThis = this;

    if (oThis.doubleOptInToken) {
      let transactionalMailParams = {
        receiverEntityId: oThis.preLaunchInviteHook.id,
        receiverEntityKind: emailServiceApiCallHookConstants.preLaunchInviteEntityKind,
        templateName: emailServiceApiCallHookConstants.doubleOptInTemplateName,
        templateVars: {
          pepo_api_domain: 1,
          doubleOptInToken: oThis.doubleOptInToken
        }
      };

      await new SendTransactionalMail(transactionalMailParams).perform();
    }
  }
}

module.exports = SendDoubleOptIn;
