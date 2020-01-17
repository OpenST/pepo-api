const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  ConnectBase = require(rootPrefix + '/app/services/connect/Base'),
  GithubLogin = require(rootPrefix + '/lib/connect/login/ByGithub'),
  GithubSignup = require(rootPrefix + '/lib/connect/signup/ByGithub'),
  GithubUserModel = require(rootPrefix + '/app/models/mysql/GithubUser'),
  GithubGetUser = require(rootPrefix + '/lib/connect/wrappers/github/GetUser'),
  GithubUserEmail = require(rootPrefix + '/lib/connect/wrappers/github/GetUserEmails'),
  GithubUserFormatter = require(rootPrefix + '/lib/connect/wrappers/github/UserEntityFormatter'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userIdentifierConstants = require(rootPrefix + '/lib/globalConstant/userIdentifier');

/**
 * Github Connect
 *
 * @class GithubConnect
 */
class GithubConnect extends ConnectBase {
  /**
   * Constructor for social platform connects base.
   *
   * @param {object} params
   * @param {string} params.access_code
   * @param {string} params.identity_token
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.accessToken = params.access_token;

    oThis.gitHubUserDetails = null;
  }

  /**
   * Method to validate access tokens and fetching data from Social platforms.
   *
   * @Sets oThis.userUniqueIdentifierKind, oThis.userUniqueIdentifierValue
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndFetchSocialInfo() {
    const oThis = this;

    let githubUserRsp = await new GithubGetUser({ oAuthToken: oThis.accessToken }).getUser();

    if (githubUserRsp.isFailure()) {
      return Promise.reject(githubUserRsp);
    }

    oThis.formattedGithubUser = new GithubUserFormatter(githubUserRsp.data);

    if (!oThis.formattedGithubUser.email) {
      let githubUserEmailRsp = await new GithubUserEmail({ oAuthToken: oThis.accessToken }).getUserEmails();
      if (githubUserEmailRsp.isFailure()) {
        return Promise.reject(githubUserRsp);
      }

      for (let i = 0; i < githubUserEmailRsp.data; i++) {
        let emailObject = githubUserEmailRsp.data[i];
        if (emailObject.primary == 'true') {
          oThis.formattedGithubUser.email = emailObject.email;
          break;
        }
      }
    }

    oThis.userUniqueIdentifierValue = oThis.formattedGithubUser.email;
    oThis.userUniqueIdentifierKind = userIdentifierConstants.emailKind;
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

    //fetch social user on the basis of apple id
    let queryResponse = await new GithubUserModel()
      .select('*')
      .where(['github_id = ?', oThis.formattedGithubUser.id])
      .fire();

    if (queryResponse.length > 0) {
      oThis.socialUserObj = queryResponse[0];
    }
  }

  /**
   * Method to check whether social account exists or not.
   *
   * @returns {boolean}
   * @private
   */
  _socialAccountExists() {
    const oThis = this;

    return oThis.socialUserObj && oThis.socialUserObj.userId;
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
    let signUpResponse = await new GithubSignup(signUpParams).perform();
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
      githubUserObj: oThis.socialUserObj
    };

    let loginResponse = await new GithubLogin(loginParams).perform();
  }
}

module.exports = GithubConnect;
