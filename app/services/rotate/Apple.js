const rootPrefix = '../../..',
  RotateAccountBase = require(rootPrefix + '/app/services/rotate/Base'),
  AppleUserModel = require(rootPrefix + '/app/models/mysql/AppleUser'),
  AppleUserExtendedModel = require(rootPrefix + '/app/models/mysql/AppleUserExtended');

class RotateAppleAccount extends RotateAccountBase {
  /**
   * @constructor
   * @param params
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.appleUserId = null;
    oThis.appleId = null;
  }

  /**
   * Fetch social user
   * @returns {Promise<never>}
   * @private
   */
  async _fetchSocialUser() {
    const oThis = this;

    const userRsp = await new AppleUserModel().fetchByUserIds([oThis.userId]);

    oThis.appleUserId = userRsp[oThis.userId].id;
    oThis.appleId = userRsp[oThis.userId].appleId;
  }

  /**
   * Rotate social account
   * @returns {Promise<void>}
   * @private
   */
  async _rotateAccount() {
    const oThis = this;

    const negatedAppleId = '-' + oThis.appleId.toString();

    await new AppleUserModel()
      .update({ apple_id: negatedAppleId })
      .where({ id: oThis.appleUserId })
      .fire();
  }

  /**
   * Delete extended data
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteSocialUserExtended() {
    const oThis = this;

    await new AppleUserExtendedModel()
      .delete()
      .where({ apple_user_id: oThis.appleUserId })
      .fire();
  }
}

module.exports = RotateAppleAccount;
