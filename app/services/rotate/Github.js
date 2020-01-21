const rootPrefix = '../../..',
  RotateAccountBase = require(rootPrefix + '/app/services/rotate/Base'),
  GithubUserModel = require(rootPrefix + '/app/models/mysql/GithubUser'),
  GithubUserExtendedModel = require(rootPrefix + '/app/models/mysql/GithubUserExtended');

/**
 * Class to rotate account.
 *
 * @class RotateGithubAccount
 */
class RotateGithubAccount extends RotateAccountBase {
  /**
   * Constructor to rotate github account.
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

    oThis.githubUserId = null;
    oThis.githubId = null;
  }

  /**
   * Fetch social user
   * @returns {Promise<never>}
   * @private
   */
  async _fetchSocialUser() {
    const oThis = this;

    const userRsp = await new GithubUserModel().fetchByUserId(oThis.userId);

    oThis.githubUserId = userRsp.id;
    oThis.githubId = userRsp.githubId;
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
