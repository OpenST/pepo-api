const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  ConnectBase = require(rootPrefix + '/app/services/connect/Base'),
  GithubLogin = require(rootPrefix + '/lib/connect/login/ByGithub'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GithubSignup = require(rootPrefix + '/lib/connect/signup/ByGithub'),
  GithubUserModel = require(rootPrefix + '/app/models/mysql/GithubUser'),
  GithubGetUser = require(rootPrefix + '/lib/connect/wrappers/github/GetUser'),
  GithubUserEmail = require(rootPrefix + '/lib/connect/wrappers/github/GetUserEmails'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  userIdentifierConstants = require(rootPrefix + '/lib/globalConstant/userIdentifier');

/**
 * Github Connect
 *
 * @class GithubConnect
 */
class GithubConnect extends ConnectBase {
  /**
   * Constructor for github connect.
   *
   * @param {object} params
   * @param {string} params.access_token
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.accessToken = params.access_token;
    oThis.duplicateRequestIdentifier = oThis.accessToken;

    oThis.formattedGithubUser = null;
  }

  /**
   * Method to validate access tokens and fetching data from Social platforms.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndFetchSocialInfo() {
    const oThis = this;

    let githubUserRsp = await new GithubGetUser().getUser({ oAuthToken: oThis.accessToken });

    if (githubUserRsp.isFailure()) {
      return Promise.reject(githubUserRsp);
    }

    oThis.formattedGithubUser = githubUserRsp.data;

    if (!oThis.formattedGithubUser.email) {
      let githubUserEmailRsp = await new GithubUserEmail().getUserEmails({ oAuthToken: oThis.accessToken });
      if (githubUserEmailRsp.isFailure()) {
        return Promise.reject(githubUserRsp);
      }

      for (let i = 0; i < githubUserEmailRsp.data.length; i++) {
        let emailObject = githubUserEmailRsp.data[i];
        if (emailObject.primary == true) {
          oThis.formattedGithubUser.email = emailObject.email;
          break;
        }
      }
    }
  }

  /**
   * Method to fetch data from respective social_users tables
   *
   * @Sets oThis.socialUserObj
   * @returns {Promise<void>}
   * @private
   */
  async _fetchSocialUser() {
    const oThis = this;

    // Fetch social user on the basis of github id.
    let queryResponse = await new GithubUserModel()
      .select('*')
      .where(['github_id = ?', oThis.formattedGithubUser.id])
      .fire();

    if (queryResponse.length > 0) {
      oThis.socialUserObj = new GithubUserModel().formatDbData(queryResponse[0]);
    }
  }

  /**
   * Method to check whether same social platform is connected before.
   *
   * @param userObj
   * @private
   */
  _sameSocialConnectUsed(userObj) {
    // Look for property set in user object.
    const propertiesArray = new UserModel().getBitwiseArray('properties', userObj.properties);

    return propertiesArray.indexOf(userConstants.hasGithubLoginProperty) > -1;
  }

  /**
   * Method to perform signup action
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performSignUp() {
    const oThis = this;

    let signUpParams = {
      accessToken: oThis.accessToken,
      userGithubEntity: oThis.formattedGithubUser
    };

    Object.assign(signUpParams, oThis._appendCommonSignupParams());
    oThis.serviceResp = await new GithubSignup(signUpParams).perform();
  }

  /**
   * Method to perform login action
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performLogin() {
    const oThis = this;

    let loginParams = {
      accessToken: oThis.accessToken,
      userGithubEntity: oThis.formattedGithubUser,
      githubUserObj: oThis.socialUserObj,
      userId: oThis.userId,
      isNewSocialConnect: oThis.newSocialConnect
    };

    oThis.serviceResp = await new GithubLogin(loginParams).perform();
  }

  /**
   * Get unique property from github info, like email
   *
   * @returns {{}|{kind: string, value: *}}
   * @private
   */
  _getSocialUserUniqueProperties() {
    const oThis = this;

    if (!oThis.formattedGithubUser.email || !CommonValidators.isValidEmail(oThis.formattedGithubUser.email)) {
      return {};
    }

    // TODO: Consider all verified emails.
    return { kind: userIdentifierConstants.emailKind, values: [oThis.formattedGithubUser.email] };
  }

  /**
   * Get current social email from parameters.
   *
   * @returns {null}
   * @private
   */
  _getCurrentSocialEmail() {
    const oThis = this;

    return oThis.formattedGithubUser.email;
  }

  /**
   * Update email in social users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateEmailInSocialUsers() {
    const oThis = this;

    let email = oThis._getCurrentSocialEmail();

    await new GithubUserModel()
      .update({ email: email })
      .where({ id: oThis.socialUserObj.id })
      .fire();
  }
}

module.exports = GithubConnect;
