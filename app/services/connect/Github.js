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
  GithubUserFormatter = require(rootPrefix + '/lib/connect/wrappers/github/UserEntityFormatter'),
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

    oThis.gitHubUserDetails = null;
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
      oThis.socialUserObj = new GithubUserModel().formatDbData(queryResponse[0]);
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
      githubUserObj: oThis.socialUserObj
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

    return { kind: userIdentifierConstants.emailKind, value: oThis.formattedGithubUser.email };
  }
}

module.exports = GithubConnect;
