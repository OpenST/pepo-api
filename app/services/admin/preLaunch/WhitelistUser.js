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
 * Class to whitelist users by admin
 *
 * @class
 */
class WhitelistUser extends ServiceBase {
  /**
   * Constructor to whitelist users by admin
   *
   * @param params
   * @param {Integer} params.invite_id: pre launch invite id
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.inviteId = params.invite_id;
  }

  /**
   * Main performer
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    let preLaunchInviteObj = new PreLaunchInviteModel({});

    await preLaunchInviteObj.whitelistUser();
  }
}

module.exports = WhitelistUser;
