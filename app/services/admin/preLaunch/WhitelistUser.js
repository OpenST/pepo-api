const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to whitelist users by admin.
 *
 * @class WhitelistUser
 */
class WhitelistUser extends ServiceBase {
  /**
   * Constructor to whitelist users by admin.
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

    const updateResponse = await new PreLaunchInviteModel().whitelistUser(oThis.inviteId);
    if (updateResponse.isFailure()) {
      return updateResponse;
    }

    await PreLaunchInviteModel.flushCache({ id: oThis.inviteId });

    return responseHelper.successWithData({});
  }
}

module.exports = WhitelistUser;
