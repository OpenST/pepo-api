const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  PreLaunchInviteByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PreLaunchInviteByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite');

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
      return updateResponse;
    }

    await PreLaunchInviteModel.flushCache({ id: oThis.inviteId });

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

    const cacheRsp = await new PreLaunchInviteByIdsCache({ ids: [oThis.inviteId] }).fetch();
    if (cacheRsp.isFailure()) {
      return cacheRsp;
    }

    if (cacheRsp.data[oThis.inviteId].adminStatus === preLaunchInviteConstants.whitelistPendingStatus) {
      const updateResponse = await new PreLaunchInviteModel().whitelistUser(oThis.inviteId);
      if (updateResponse.isFailure()) {
        return updateResponse;
      }

      await PreLaunchInviteModel.flushCache({ id: oThis.inviteId });
    }

    return responseHelper.successWithData({});
  }
}

module.exports = ApproveUser;
