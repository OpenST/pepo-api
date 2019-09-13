const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TemporaryTokenModel = require(rootPrefix + '/app/models/mysql/TemporaryToken'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookCreator/SendTransactionalMail'),
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  pageConstants = require(rootPrefix + '/lib/globalConstant/page'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  temporaryTokenConstants = require(rootPrefix + '/lib/globalConstant/temporaryToken'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook');

/**
 * Class to send double opt in email.
 *
 * @class SendDoubleOptIn
 */
class SendDoubleOptIn extends ServiceBase {
  /**
   * Constructor to send double opt in email.
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
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    if (oThis.preLaunchInviteObj.status === preLaunchInviteConstants.doptinStatus) {
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
      .update({ status: temporaryTokenConstants.invertedStatuses[temporaryTokenConstants.inActiveStatus] })
      .where({
        entity_id: oThis.preLaunchInviteObj.id,
        kind: temporaryTokenConstants.invertedKinds[temporaryTokenConstants.preLaunchInviteKind],
        status: temporaryTokenConstants.invertedStatuses[temporaryTokenConstants.activeStatus]
      })
      .fire();

    const tokenString = `${oThis.preLaunchInviteObj.id}::${
        oThis.preLaunchInviteObj.email
      }::${Date.now()}::preLaunchInviteDoubleOptIn::${Math.random()}`,
      temporaryDoubleOptInToken = util.createMd5Digest(tokenString);

    const insertResponse = await new TemporaryTokenModel()
      .insert({
        entity_id: oThis.preLaunchInviteObj.id,
        kind: temporaryTokenConstants.invertedKinds[temporaryTokenConstants.preLaunchInviteKind],
        token: temporaryDoubleOptInToken,
        status: temporaryTokenConstants.invertedStatuses[temporaryTokenConstants.activeStatus]
      })
      .fire();

    if (!insertResponse) {
      logger.error('Error while inserting data into pre_launch_invites table.');

      return Promise.reject(new Error('Error while inserting data into pre_launch_invites table.'));
    }

    const doubleOptInTokenStr = `${insertResponse.insertId.toString()}:${temporaryDoubleOptInToken}`;

    oThis.doubleOptInToken = localCipher.encrypt(coreConstants.PA_EMAIL_TOKENS_DECRIPTOR_KEY, doubleOptInTokenStr);
  }

  /**
   * Send pre launch invite double opt in mail.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendPreLaunchInviteDoubleOptInMail() {
    const oThis = this;

    const link = encodeURIComponent(`${pageConstants.optInEmailLink}?t=${oThis.doubleOptInToken}`);

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
