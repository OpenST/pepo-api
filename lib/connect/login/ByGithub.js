const rootPrefix = '../../..',
  LoginConnectBase = require(rootPrefix + '/lib/connect/login/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  GithubUserModel = require(rootPrefix + '/app/models/mysql/GithubUser'),
  GithubUserExtendedModel = require(rootPrefix + '/app/models/mysql/GithubUserExtended'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
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
   * @param {string} params.token: Oauth User Token
   * @param {string} params.userId: user id
   *
   * @augments LoginConnectBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.token = params.token;
    oThis.userId = params.userId;

    oThis.githubUserExtended = null;
  }
}

module.exports = LoginConnectByGithub;
