/**
 * Formatter for user entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/LoggedInUser
 */

const rootPrefix = '../../..',
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user formatter.
 *
 * @class
 */
class LoggedInUserFormatter {
  /**
   * Constructor for user formatter.
   *
   * @param {Object} params
   * @param {Object} params.user
   * @param {Object} params.tokenUser
   *
   * @param {Number} params.user.id
   * @param {String} params.user.firstName
   * @param {String} params.user.lastName
   * @param {Array}[String] params.user.properties
   * @param {String} params.user.status
   * @param {Number} params.user.createdAt
   * @param {Number} params.user.updatedAt
   *
   * @param {Number} params.tokenUser.id
   * @param {Number} params.tokenUser.userId
   * @param {String} params.tokenUser.ostUserId
   * @param [String] params.tokenUser.ostTokenHolderAddress
   * @param {Array}[String] params.tokenUser.properties
   * @param {String} params.tokenUser.ostStatus
   * @param {Number} params.tokenUser.createdAt
   * @param {Number} params.tokenUser.updatedAt
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.user = params.user;
    oThis.tokenUser = params.tokenUser;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    let uts = oThis.user.updatedAt > oThis.tokenUser.updatedAt ? oThis.user.updatedAt : oThis.tokenUser.updatedAt,
      signUpAirdropStatus = oThis._getSignupAirdropStatus(oThis.tokenUser);

    const formattedData = {
      id: Number(oThis.user.id),
      first_name: oThis.user.firstName,
      last_name: oThis.user.lastName,
      status: oThis.user.status,
      uts: uts,
      ost_user_id: oThis.tokenUser.ostUserId,
      ost_token_holder_address: oThis.tokenUser.ostTokenHolderAddress || null,
      ost_status: oThis.tokenUser.ostStatus,
      signup_airdrop_status: signUpAirdropStatus
    };

    return responseHelper.successWithData(formattedData);
  }

  /**
   * Get Airdrop Signup Status
   *
   * @return {Integer}
   *
   * @private
   */
  _getSignupAirdropStatus(tokenUser) {
    let propertiesArray = new TokenUserModel().getBitwiseArray('properties', tokenUser.properties);
    if (propertiesArray.indexOf(tokenUserConstants.airdropDoneProperty) > -1) {
      return 1;
    } else {
      return 0;
    }
  }
}

module.exports = LoggedInUserFormatter;
