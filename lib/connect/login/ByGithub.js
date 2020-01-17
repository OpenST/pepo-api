const rootPrefix = '../../..',
  LoginConnectBase = require(rootPrefix + '/lib/connect/login/Base'),
  GithubUserModel = require(rootPrefix + '/app/models/mysql/GithubUser'),
  GithubUserExtendedModel = require(rootPrefix + '/app/models/mysql/GithubUserExtended'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for Github Login service.
 *
 * @class LoginConnectByGithub
 */
class LoginConnectByGithub extends LoginConnectBase {
  /**
   * Constructor for Github Login service.
   *
   * @param {object} params
   * @param {object} params.githubUserObj: Github User Table Obj
   * @param {string} params.accessToken: Oauth User Token
   * @param {string} params.userGithubEntity: User Entity Of Github
   * @param {string} params.userId: user id
   *
   * @augments LoginConnectBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.githubUserObj = params.githubUserObj;
    oThis.accessToken = params.accessToken;
    oThis.userGithubEntity = params.userGithubEntity;

    oThis.userId = oThis.githubUserObj.userId;

    oThis.githubUserExtendedObj = null;
  }

  /**
   * Update Github User Extended object.
   *
   * @sets oThis.githubUserExtendedObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateSocialUserExtended() {
    const oThis = this;

    logger.log('Start::Update Github User Extended for login', oThis.githubUserObj);

    let encryptedAccessToken = localCipher.encrypt(oThis.decryptedEncryptionSalt, oThis.accessToken);

    // TODO - dhananjay - use cache instead
    oThis.githubUserExtendedObj = await new GithubUserExtendedModel().fetchByGithubUserId(oThis.githubUserObj.id);

    await new GithubUserExtendedModel()
      .update({
        access_token: encryptedAccessToken
      })
      .where({ id: oThis.githubUserObj.id })
      .fire();

    logger.log('End::Update Github User Extended for login');

    return responseHelper.successWithData({});
  }

  /**
   * Fetch social user extended.
   *
   *
   * @returns {Promise<Array>}
   * @private
   */
  async _fetchSocialUserExtended() {
    const oThis = this;

    return new GithubUserExtendedModel().safeFormattedData(oThis.githubUserExtendedObj);
  }

  /**
   * Insert into twitter users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertIntoSocialUsers() {
    const oThis = this;

    await new GithubUserModel()
      .insert({
        github_id: oThis.userGithubEntity.id,
        user_id: oThis.userId,
        user_name: oThis.userGithubEntity.userName,
        name: oThis.userGithubEntity.formattedName,
        email: oThis._getUserSocialEmail,
        profile_image_url: oThis.userGithubEntity.profileImageUrl
      })
      .fire();
  }

  /**
   *  Get Social email of user from social entity
   *
   * @private
   */
  _getUserSocialEmail() {
    const oThis = this;

    let githubEmail = oThis.userGithubEntity.email;

    // email info is not mandatory to come from github.
    if (!oThis.userGithubEntity.email || !CommonValidators.isValidEmail(oThis.userGithubEntity.email)) {
      githubEmail = null;
    }

    return githubEmail;
  }

  /**
   * Update twitter users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateSocialUsers() {
    const oThis = this;

    await new GithubUserModel()
      .update({
        user_id: oThis.userId,
        user_name: oThis.userGithubEntity.userName
      })
      .where({ id: oThis.githubUserObj.id })
      .fire();
  }

  /**
   * Update handle in github users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _syncDataInSocialUsers() {
    return true;
  }
}

module.exports = LoginConnectByGithub;
