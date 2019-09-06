const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite');

/**
 * Class for mark Creator.
 *
 * @class Creator
 */
class Creator extends ServiceBase {
  /**
   * Constructor for mark Creator.
   *
   * @param {object} params
   * @param {string} params.current_pre_launch_invite: current pre launch invite
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.securePreLaunchInviteObj = params.current_pre_launch_invite;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    if (oThis.securePreLaunchInviteObj.creatorStatus === preLaunchInviteConstants.notAppliedCreatorStatus) {
      await oThis._updateCreatorStatus();
    }

    return responseHelper.successWithData({});
  }

  /**
   * Update creator status.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateCreatorStatus() {
    const oThis = this;

    await new PreLaunchInviteModel()
      .update({
        creator_status: preLaunchInviteConstants.invertedCreatorStatuses[preLaunchInviteConstants.appliedCreatorStatus]
      })
      .where({ id: oThis.securePreLaunchInviteObj.id })
      .fire();

    await PreLaunchInviteModel.flushCache(oThis.securePreLaunchInviteObj);
  }
}

module.exports = Creator;
