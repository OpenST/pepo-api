/**
 * Formatter for user entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/LoggedInUser
 */

const rootPrefix = '../../..',
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

    oThis.params = params;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    const user = oThis.params.user;
    const tokenUser = oThis.params.tokenUser;

    let uts = user.updatedAt > tokenUser.updatedAt ? user.updatedAt : tokenUser.updatedAt;
    const signUpAirdropStatus = oThis._getSignupAirdropStatus(tokenUser);

    const formattedData = {
      id: Number(user.id),
      first_name: user.firstName,
      last_name: user.lastName,
      status: user.status,
      uts: uts,
      ost_user_id: tokenUser.ostUserId,
      ost_token_holder_address: tokenUser.ostTokenHolderAddress || null,
      ost_status: tokenUser.ostStatus,
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
  async _getSignupAirdropStatus(tokenUser) {
    const oThis = this;
    let propertiesArray = await new TokenUserModel().getBitwiseArray('properties', tokenUser.properties);
    if (propertiesArray.indexOf('AIRDROP_DONE') > -1) {
      return 1;
    } else {
      return 0;
    }
  }
}

module.exports = LoggedInUserFormatter;
