const rootPrefix = '../../..',
  GithubUserModel = require(rootPrefix + '/app/models/mysql/GithubUser'),
  GithubUserExtendedModel = require(rootPrefix + '/app/models/mysql/GithubUserExtended');

/**
 * Class to rotate account.
 *
 * @class RotateGithubAccount
 */
class RotateGithubAccount {
  /**
   * Constructor to rotate github account.
   *
   * @param {object} params
   * @param {string} params.userId: user id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.githubUserId = null;
    oThis.githubId = null;
  }

  async perform() {
    const oThis = this;

    await oThis._fetchSocialUser();
    await oThis._rotateAccount();
    await oThis._deleteSocialUserExtended();
  }

  /**
   * Fetch social user
   * @returns {Promise<never>}
   * @private
   */
  async _fetchSocialUser() {
    const oThis = this;

    const userRsp = await new GithubUserModel().fetchByUserIds([oThis.userId]);

    oThis.githubUserId = userRsp[oThis.userId].id;
    oThis.githubId = userRsp[oThis.userId].githubId;
  }

  /**
   * Rotate social account
   * @returns {Promise<void>}
   * @private
   */
  async _rotateAccount() {
    const oThis = this;

    const negatedGithubUserId = '-' + oThis.githubUserId.toString();

    await new GithubUserModel()
      .update({ github_id: negatedGithubUserId })
      .where({ id: oThis.githubUserId })
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

    await new GithubUserExtendedModel()
      .delete()
      .where({ github_user_id: oThis.githubUserId })
      .fire();
  }
}

module.exports = RotateGithubAccount;
