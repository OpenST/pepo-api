const rootPrefix = '../../..',
  LoginConnectBase = require(rootPrefix + '/lib/connect/login/Base'),
  GithubUserModel = require(rootPrefix + '/app/models/mysql/GithubUser'),
  GithubUserExtendedModel = require(rootPrefix + '/app/models/mysql/GithubUserExtended'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  socialConnectServiceTypeConstants = require(rootPrefix + '/lib/globalConstant/socialConnectServiceType'),
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

    oThis.userId = params.userId;

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
  async _createUpdateSocialUserExtended() {
    const oThis = this;

    logger.log('Start::Update Github User Extended for login', oThis.githubUserObj);

    // TODO - dhananjay - use cache instead
    oThis.githubUserExtendedObj = await new GithubUserExtendedModel().fetchByGithubUserId(oThis.githubUserObj.id);

    // If githubUserExtendedObj is not present and user is trying to login.
    if (!CommonValidators.validateNonEmptyObject(oThis.githubUserExtendedObj) && !oThis.isNewSocialConnect) {
      // If isNewSocialConnect means user is already present but github is connected first time.
      // If isNewSocialConnect is false and githubUserExtendedObj is empty means its an error
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_c_l_bgit_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }

    if (CommonValidators.validateNonEmptyObject(oThis.githubUserExtendedObj)) {
      await oThis._updateGithubUserExtended();
    } else {
      await oThis._insertGithubUserExtended();
    }

    logger.log('End::Update Github User Extended for login');

    return responseHelper.successWithData({});
  }

  /**
   * Update Github user extended.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateGithubUserExtended() {
    const oThis = this;

    await new GithubUserExtendedModel()
      .update({
        access_token: oThis._getLCEncryptedToken(oThis.accessToken)
      })
      .where({ id: oThis.githubUserExtendedObj.id })
      .fire();
  }

  /**
   * Insert Github User Extended
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertGithubUserExtended() {
    const oThis = this;

    let insertData = {
      github_user_id: oThis.githubUserObj.id,
      access_token: oThis._getLCEncryptedToken(oThis.accessToken)
    };

    // Insert user in database.
    const insertResponse = await new GithubUserExtendedModel().insert(insertData).fire();
    oThis.githubUserExtendedObj = new GithubUserExtendedModel().formatDbData(insertData);
  }

  /**
   * Fetch social user extended.
   *
   * @returns {Promise<Array>}
   * @private
   */
  async _fetchSocialUserExtended() {
    const oThis = this;

    return new GithubUserExtendedModel().safeFormattedData(oThis.githubUserExtendedObj);
  }

  /**
   * Insert into github users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertIntoSocialUsers() {
    const oThis = this;

    let insertData = {
        github_id: oThis.userGithubEntity.id,
        user_id: oThis.userId,
        user_name: oThis.userGithubEntity.userName,
        name: oThis.userGithubEntity.formattedName,
        email: oThis._getUserSocialEmail(),
        profile_image_url: oThis._getProfileImageUrl()
      },
      insertResponse = await new GithubUserModel().insert(insertData).fire();

    insertData.id = insertResponse.insertId;
    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    oThis.githubUserObj = new GithubUserModel().formatDbData(insertData);
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
   * Sync additional data in github user table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _syncDataInSocialUsers() {
    const oThis = this;

    if (
      oThis.githubUserObj.email &&
      oThis.githubUserObj.email === oThis._getUserSocialEmail() &&
      oThis.githubUserObj.userName === oThis.userGithubEntity.userName
    ) {
      return responseHelper.successWithData({});
    }

    await new GithubUserModel()
      .update({
        user_name: oThis.userGithubEntity.userName,
        email: oThis._getUserSocialEmail()
      })
      .where({
        id: oThis.githubUserObj.id
      })
      .fire();
  }

  /**
   * Get service type.
   *
   * @returns {string}
   * @private
   */
  _getServiceType() {
    return socialConnectServiceTypeConstants.githubSocialConnect;
  }

  /**
   * Get social account login property.
   *
   * @returns {String}
   * @private
   */
  _getSocialAccountLoginProperty() {
    return userConstants.hasGithubLoginProperty;
  }

  /**
   * Get profile image url.
   *
   * @returns {null|*|string}
   * @private
   */
  _getProfileImageUrl() {
    const oThis = this;

    if (!oThis.userGithubEntity.profileImageUrl) {
      oThis.profileImageId = null;
      logger.log('End::Save Profile Image. Default github profile pic.');
      return null;
    }

    return oThis.userGithubEntity.profileImageUrl;
  }

  /**
   * Get social bio
   *
   * @returns {null|*|string}
   * @private
   */
  _getSocialBio() {
    const oThis = this;

    return oThis.userGithubEntity.bio;
  }
}

module.exports = LoginConnectByGithub;
