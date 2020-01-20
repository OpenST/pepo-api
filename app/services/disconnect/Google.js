const rootPrefix = '../../..',
  DisconnectBase = require(rootPrefix + '/app/services/disconnect/Base'),
  GoogleUserModel = require(rootPrefix + '/app/models/mysql/GoogleUser'),
  GoogleUserExtendedModel = require(rootPrefix + '/app/models/mysql/GoogleUserExtended');

class GithubDisconnect extends DisconnectBase {
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

    const response = await new GoogleUserModel().fetchByUserId(oThis.currentUserId);

    oThis.githubUserId = response.id;
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
      .where({ github_user_id: oThis.githubUserId })
      .fire();
  }
}

module.exports = GithubDisconnect;
