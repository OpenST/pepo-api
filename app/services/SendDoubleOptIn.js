const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TemporaryTokenModel = require(rootPrefix + '/app/models/mysql/TemporaryToken'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookCreator/SendTransactionalMail'),
  util = require(rootPrefix + '/lib/util'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  webPageConstants = require(rootPrefix + '/lib/globalConstant/webPage'),
  temporaryTokenConstant = require(rootPrefix + '/lib/globalConstant/temporaryToken'),
  preLaunchInviteConstant = require(rootPrefix + '/lib/globalConstant/preLaunchInvite'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook');

/**
 * Class to send double opt in token for pre launch.
 *
 * @class SendDoubleOptIn
 */
class SendDoubleOptIn extends ServiceBase {
  /**
   * Constructor to send double opt in token for pre launch.
   *
   * @param {object} params
   * @param {object} params.pre_launch_invite_obj
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.preLaunchInviteObj = params.pre_launch_invite_obj;

    oThis.doubleOptInToken = null;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    if (oThis.preLaunchInviteObj.status === preLaunchInviteConstant.doptinStatus) {
      return responseHelper.successWithData({});
    }

    await oThis._createDoubleOptInToken();

    await oThis._sendPreLaunchInviteDoubleOptInMail();

    return responseHelper.successWithData({});
  }

  /**
   * Create double opt in token.
   *
   * @sets oThis.doubleOptInToken
   *
   * @returns {Promise<never>}
   * @private
   */
  async _createDoubleOptInToken() {
    const oThis = this;

    await new TemporaryTokenModel()
      .update({ status: temporaryTokenConstant.invertedStatuses[temporaryTokenConstant.inActiveStatus] })
      .where({
        entity_id: oThis.preLaunchInviteObj.id,
        kind: temporaryTokenConstant.invertedKinds[temporaryTokenConstant.preLaunchInviteKind],
        status: temporaryTokenConstant.invertedStatuses[temporaryTokenConstant.activeStatus]
      })
      .fire();

    const tokenString = `${oThis.preLaunchInviteObj.id}::${
        oThis.preLaunchInviteObj.email
      }::${Date.now()}::preLaunchInviteDoubleOptIn::${Math.random()}`,
      temporaryDoubleOptInToken = util.createMd5Digest(tokenString);

    oThis.doubleOptInToken = await new TemporaryTokenModel().createDoubleOptInToken({
      entityId: oThis.preLaunchInviteObj.id,
      kind: temporaryTokenConstant.preLaunchInviteKind,
      token: temporaryDoubleOptInToken
    });
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

    const link = encodeURIComponent(`${webPageConstants.optInEmailLink}?t=${oThis.doubleOptInToken}`);

    const transactionalMailParams = {
      receiverEntityId: oThis.preLaunchInviteObj.id,
      receiverEntityKind: emailServiceApiCallHookConstants.preLaunchInviteEntityKind,
      templateName: emailServiceApiCallHookConstants.pepoDoubleOptInTemplateName,
      templateVars: {
        pepo_api_domain: 1,
        opt_in_email_link: link
      }
    };

    await new SendTransactionalMail(transactionalMailParams).perform();
  }
}

module.exports = SendDoubleOptIn;
