const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  pageConstants = require(rootPrefix + '/lib/globalConstant/page'),
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
   * @param {string} params.pre_launch_invite_obj
   *
   */
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.preLaunchInviteObj = params.pre_launch_invite_obj;
    oThis.doubleOptInToken = null;
  }

  /**
   * Async performer.
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
   * Create double opt in token
   *
   * @returns {Promise<never>}
   * @private
   */
  async _createDoubleOptInToken() {
    const oThis = this;
    let tokenString = `${oThis.preLaunchInviteObj.id}::${
        oThis.preLaunchInviteObj.email
      }::${Date.now()}::preLaunchInviteDoubleOptIn::${Math.random()}`,
      temporaryDoubleOptInToken = util.createMd5Digest(tokenString);

    let insertResponse = await new TemporaryTokenModel()
      .insert({
        entity_id: oThis.preLaunchInviteObj.id,
        kind: temporaryTokenConstant.invertedKinds[temporaryTokenConstant.preLaunchInviteKind],
        token: temporaryDoubleOptInToken,
        status: temporaryTokenConstant.invertedStatuses[temporaryTokenConstant.activeStatus]
      })
      .fire();

    if (!insertResponse) {
      logger.error('Error while inserting data into pre_launch_invites table.');
      return Promise.reject(new Error('Error while inserting data into pre_launch_invites table.'));
    }

    let doubleOptInTokenStr = `${insertResponse.insertId.toString()}:${temporaryDoubleOptInToken}`;
    oThis.doubleOptInToken = localCipher.encrypt(coreConstants.PA_EMAIL_TOKENS_DECRIPTOR_KEY, doubleOptInTokenStr);

    await new TemporaryTokenModel()
      .update({ status: temporaryTokenConstant.invertedStatuses[temporaryTokenConstant.inActiveStatus] })
      .where({
        entity_id: oThis.preLaunchInviteObj.id,
        kind: temporaryTokenConstant.invertedKinds[temporaryTokenConstant.preLaunchInviteKind],
        status: temporaryTokenConstant.invertedStatuses[temporaryTokenConstant.activeStatus]
      })
      .fire();
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

    let transactionalMailParams = {
      receiverEntityId: oThis.preLaunchInviteObj.id,
      receiverEntityKind: emailServiceApiCallHookConstants.preLaunchInviteEntityKind,
      templateName: emailServiceApiCallHookConstants.pepoDoubleOptInTemplateName,
      templateVars: {
        pepo_api_domain: 1,
        opt_in_email_link: `${pageConstants.optInEmailLink}?t=${oThis.doubleOptInToken}`
      }
    };

    await new SendTransactionalMail(transactionalMailParams).perform();
  }
}

module.exports = SendDoubleOptIn;
