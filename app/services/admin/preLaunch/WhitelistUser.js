/**
 * Module to whitelist users
 *
 * @module app/services/admin/preLaunc/WhitelistUser
 */
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
   *
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
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await new PreLaunchInviteModel().whitelistUser(oThis.inviteId);

    return responseHelper.successWithData({});
  }
}

module.exports = WhitelistUser;
