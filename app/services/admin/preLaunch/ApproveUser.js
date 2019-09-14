const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  PreLaunchInviteByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PreLaunchInviteByIds'),
  SecurePreLaunchInviteCache = require(rootPrefix + '/lib/cacheManagement/single/SecurePreLaunchInvite'),
  preLaunchInviteConstant = require(rootPrefix + '/lib/globalConstant/preLaunchInvite'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to approve users by admin.
 *
 * @class ApproveUser
 */
class ApproveUser extends ServiceBase {
  /**
   * Constructor to approve users by admin.
   *
   * @param {object} params
   * @param {number} params.invite_id: pre launch invite id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.inviteId = params.invite_id;

    oThis.securePreLaunchInviteObj = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<Result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    const updateResponse = await new PreLaunchInviteModel().approveUser(oThis.inviteId);

    if (updateResponse.isFailure()) {
      return Promise.reject(updateResponse);
    }

    await PreLaunchInviteModel.flushCache({ id: oThis.inviteId });

    await oThis._markInviteLimitAsInfinite();

    await oThis._whitelistIfRequired();

    return responseHelper.successWithData({});
  }

  /**
   * White list if required
   *
   * @returns {Promise<Result>}
   * @private
   */
  async _whitelistIfRequired() {
    const oThis = this;

    let cacheRsp = await new PreLaunchInviteByIdsCache({ ids: [oThis.inviteId] }).fetch();

    if (cacheRsp.isFailure()) {
      return cacheRsp;
    }

    if (cacheRsp.data[oThis.inviteId].adminStatus == preLaunchInviteConstant.whitelistPendingStatus) {
      const updateResponse = await new PreLaunchInviteModel().whitelistUser(oThis.inviteId);

      if (updateResponse.isFailure()) {
        return Promise.reject(updateResponse);
      }

      await PreLaunchInviteModel.flushCache({ id: oThis.inviteId });
    }

    return responseHelper.successWithData({});
  }

  /**
   * Mark invite limit as infinite
   *
   * @returns {Promise<*>}
   * @private
   */
  async _markInviteLimitAsInfinite() {
    const oThis = this;

    const securePreLaunchInviteRes = await new SecurePreLaunchInviteCache({ id: oThis.inviteId }).fetch();

    if (securePreLaunchInviteRes.isFailure()) {
      return Promise.reject(securePreLaunchInviteRes);
    }

    oThis.securePreLaunchInviteObj = securePreLaunchInviteRes.data;
    let inviteCodeId = oThis.securePreLaunchInviteObj.inviteCodeId;

    const queryResponse = await new InviteCodeModel()
      .update({
        invite_limit: inviteCodeConstants.infiniteInviteLimitForNonCreator
      })
      .where({ id: inviteCodeId })
      .fire();

    if (queryResponse.affectedRows === 1) {
      logger.info(`User with ${oThis.inviteId} has now infinite invites`);

      await InviteCodeModel.flushCache({ id: inviteCodeId });

      return responseHelper.successWithData({});
    }

    return responseHelper.error({
      internal_error_identifier: 'a_s_a_pl_au_1',
      api_error_identifier: 'something_went_wrong',
      debug_options: { inviteId: oThis.inviteId, inviteCodeId: inviteCodeId }
    });
  }
}

module.exports = ApproveUser;
