const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite');
responseHelper = require(rootPrefix + '/lib/formatter/response');

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
   * Perform: Perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    if (oThis.securePreLaunchInviteObj.creatorStatus === preLaunchInviteConstants.notAppliedCreator) {
      await oThis._updateCreatorStatus();
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Update creator status
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateCreatorStatus() {
    const oThis = this;

    await new PreLaunchInviteModel()
      .update({ creator_status: preLaunchInviteConstants.invertedCreators[preLaunchInviteConstants.appliedCreator] })
      .where({ id: oThis.securePreLaunchInviteObj.id })
      .fire();

    await PreLaunchInviteModel.flushCache(oThis.securePreLaunchInviteObj);
  }
}

module.exports = Creator;
