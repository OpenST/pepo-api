const rootPrefix = '../../..',
  RotateAccountBase = require(rootPrefix + '/app/services/rotate/Base'),
  GoogleUserModel = require(rootPrefix + '/app/models/mysql/GoogleUser'),
  GoogleUserExtendedModel = require(rootPrefix + '/app/models/mysql/GoogleUserExtended');

/**
 * Class to rotate account.
 *
 * @class RotateGoogleAccount
 */
class RotateGoogleAccount extends RotateAccountBase {
  /**
   * Constructor to rotate google account.
   *
   * @param {object} params
   * @param {string} params.user_name: user name
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.googleUserId = null;
    oThis.googleId = null;
  }

  /**
   * Fetch social user
   * @returns {Promise<never>}
   * @private
   */
  async _fetchSocialUser() {
    const oThis = this;

    const userRsp = await new GoogleUserModel().fetchByUserIds([oThis.userId]);

    oThis.googleUserId = userRsp[oThis.userId].id;
    oThis.googleId = userRsp[oThis.userId].googleId;
  }

  /**
   * Rotate social account
   * @returns {Promise<void>}
   * @private
   */
  async _rotateAccount() {
    const oThis = this;

    const negatedGoogleUserId = '-' + oThis.googleUserId.toString();

    await new GoogleUserModel()
      .update({ google_id: negatedGoogleUserId })
      .where({ id: oThis.googleUserId })
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

    await new GoogleUserExtendedModel()
      .delete()
      .where({ google_user_id: oThis.googleUserId })
      .fire();
  }
}

module.exports = RotateGoogleAccount;
