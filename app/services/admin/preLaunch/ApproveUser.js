const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  InviteCodeByIdCache = require(rootPrefix + '/lib/cacheManagement/single/InviteCodeById'),
  PreLaunchInviteByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PreLaunchInviteByIds'),
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

    const cacheRsp = await new PreLaunchInviteByIdsCache({ ids: [oThis.inviteId] }).fetch();
    if (cacheRsp.isFailure()) {
      return cacheRsp;
    }

    let preLaunchInviteObj = cacheRsp.data[oThis.inviteId],
      inviteCodeId = preLaunchInviteObj.inviteCodeId;

    const inviteCodeByIdCacheResponse = await new InviteCodeByIdCache({
      id: inviteCodeId
    }).fetch();

    if (inviteCodeByIdCacheResponse.isFailure()) {
      return Promise.reject(inviteCodeByIdCacheResponse);
    }

    let inviteCodeObj = inviteCodeByIdCacheResponse.data;

    const queryResponse = await new InviteCodeModel()
      .update({
        invite_limit: inviteCodeConstants.infiniteInviteLimit
      })
      .where({ id: inviteCodeId })
      .fire();

    if (queryResponse.affectedRows === 1) {
      logger.info(`User with ${oThis.inviteId} has now infinite invites`);

      await InviteCodeModel.flushCache(inviteCodeObj);

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
