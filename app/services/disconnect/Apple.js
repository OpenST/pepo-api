const rootPrefix = '../../..',
  DisconnectBase = require(rootPrefix + '/app/services/disconnect/Base'),
  AppleUserModel = require(rootPrefix + '/app/models/mysql/AppleUser'),
  AppleUserExtendedModel = require(rootPrefix + '/app/models/mysql/AppleUserExtended');

class AppleDisconnect extends DisconnectBase {
  /**
   * @constructor
   */
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.appleUserId = null;
  }

  /**
   * Get apple user id.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getSocialId() {
    const oThis = this;

    const response = await new AppleUserModel().fetchByUserIds([oThis.currentUserId]);

    oThis.appleUserId = response[oThis.currentUserId].id;
  }

  /**
   * Mark token and secret null in apple users extended.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markTokenNull() {
    const oThis = this;

    await new AppleUserExtendedModel()
      .update({
        access_token: null,
        refresh_token: null
      })
      .where({ apple_user_id: oThis.appleUserId })
      .fire();
  }
}

module.exports = AppleDisconnect;
