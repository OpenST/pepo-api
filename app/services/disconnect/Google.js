const rootPrefix = '../../..',
  DisconnectBase = require(rootPrefix + '/app/services/disconnect/Base'),
  GoogleUserModel = require(rootPrefix + '/app/models/mysql/GoogleUser'),
  GoogleUserExtendedModel = require(rootPrefix + '/app/models/mysql/GoogleUserExtended');

class GoogleDisconnect extends DisconnectBase {
  /**
   * @constructor
   */
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.githubUserId = null;
  }

  /**
   * Get github user id
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getSocialId() {
    const oThis = this;

    const response = await new GoogleUserModel().fetchByUserIds([oThis.currentUserId]);

    oThis.googleUserId = response[oThis.currentUserId].id;
  }

  /**
   * Mark access token null
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markTokenNull() {
    const oThis = this;

    await new GoogleUserExtendedModel()
      .update({
        access_token: null,
        refresh_token: null
      })
      .where({ google_user_id: oThis.googleUserId })
      .fire();
  }
}

module.exports = GoogleDisconnect;
