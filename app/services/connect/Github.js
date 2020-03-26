const rootPrefix = '../../..',
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
 * Class for github connect.
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
   * @augments ConnectBase
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
   * Method to validate access tokens and fetching data from social platforms.
   *
   * @sets oThis.formattedGithubUser
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndFetchSocialInfo() {
    const oThis = this;

    const githubUserRsp = await new GithubGetUser().getUser({ oAuthToken: oThis.accessToken });

    if (githubUserRsp.isFailure()) {
      return Promise.reject(githubUserRsp);
    }

    oThis.formattedGithubUser = githubUserRsp.data;

    if (!oThis.formattedGithubUser.email) {
      const githubUserEmailRsp = await new GithubUserEmail().getUserEmails({ oAuthToken: oThis.accessToken });
      if (githubUserEmailRsp.isFailure()) {
        return Promise.reject(githubUserRsp);
      }

      for (let index = 0; index < githubUserEmailRsp.data.length; index++) {
        const emailObject = githubUserEmailRsp.data[index];
        if (emailObject.primary == true) {
          oThis.formattedGithubUser.email = emailObject.email;
          break;
        }
      }
    }
  }

  /**
   * Method to fetch data from respective social_users tables.
   *
   * @sets oThis.socialUserObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchSocialUser() {
    const oThis = this;

    // Fetch social user on the basis of github id.
    const queryResponse = await new GithubUserModel()
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
   * @param {object} userObj
   *
   * @returns {boolean}
   * @private
   */
  _sameSocialConnectUsed(userObj) {
    // Look for property set in user object.
    const propertiesArray = new UserModel().getBitwiseArray('properties', userObj.properties);

    return propertiesArray.indexOf(userConstants.hasGithubLoginProperty) > -1;
  }

  /**
   * Method to perform signup action.
   *
   * @sets oThis.serviceResp
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performSignUp() {
    const oThis = this;

    const signUpParams = {
      accessToken: oThis.accessToken,
      userGithubEntity: oThis.formattedGithubUser,
      headers: oThis.headers
    };

    Object.assign(signUpParams, oThis._appendCommonSignupParams());

    oThis.serviceResp = await new GithubSignup(signUpParams).perform();
  }

  /**
   * Method to perform login action.
   *
   * @sets oThis.serviceResp
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performLogin() {
    const oThis = this;

    const loginParams = {
      accessToken: oThis.accessToken,
      userGithubEntity: oThis.formattedGithubUser,
      githubUserObj: oThis.socialUserObj,
      userId: oThis.userId,
      isNewSocialConnect: oThis.newSocialConnect,
      apiSource: oThis.apiSource
    };

    oThis.serviceResp = await new GithubLogin(loginParams).perform();
  }

  /**
   * Get unique property from github info, like email.
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
}

module.exports = GithubConnect;
