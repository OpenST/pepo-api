const rootPrefix = '../../..',
  DisconnectBase = require(rootPrefix + '/app/services/disconnect/Base'),
  GithubUserModel = require(rootPrefix + '/app/models/mysql/GithubUser'),
  GithubUserExtendedModel = require(rootPrefix + '/app/models/mysql/GithubUserExtended');

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

    const response = await new GithubUserModel().fetchByUserIds([oThis.currentUserId]);

    oThis.githubUserId = response[oThis.currentUserId].id;
  }

  /**
   * Mark access token null
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markTokenNull() {
    const oThis = this;

    await new GithubUserExtendedModel()
      .update({
        access_token: null
      })
      .where({ github_user_id: oThis.githubUserId })
      .fire();
  }
}

module.exports = GithubDisconnect;
