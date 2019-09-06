const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for Pre Launch Invite get account info .
 *
 * @class PreLaunchAccount
 */
class PreLaunchAccount extends ServiceBase {
  /**
   * Constructor for Pre Launch Invite get account info service.
   *
   * @param {object} params
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
   * Perform: Async .
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    const safeFormattedPreLaunchInviteData = new PreLaunchInviteModel().safeFormattedData(
      oThis.securePreLaunchInviteObj
    );

    return Promise.resolve(responseHelper.successWithData({ preLaunchInvite: safeFormattedPreLaunchInviteData }));
  }
}

module.exports = PreLaunchAccount;
