/**
 * Formatter for user entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/user/Single
 */

const rootPrefix = '../../../..',
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser');

/**
 * Class for user formatter.
 *
 * @class UserFormatter
 */
class UserFormatter {
  /**
   * Constructor for user formatter.
   *
   * @param {object} params
   * @param {object} params.user
   * @param {object} params.tokenUser
   *
   * @param {number} params.user.id
   * @param {string} params.user.firstName
   * @param {string} params.user.lastName
   * @param {array<string>} params.user.properties
   * @param {string} params.user.status
   * @param {number} params.user.createdAt
   * @param {number} params.user.updatedAt
   *
   * @param {number} params.tokenUser.id
   * @param {number} params.tokenUser.userId
   * @param {string} params.tokenUser.ostUserId
   * @param {string} params.tokenUser.ostTokenHolderAddress
   * @param {array<string>} params.tokenUser.properties
   * @param {string} params.tokenUser.ostStatus
   * @param {number} params.tokenUser.createdAt
   * @param {number} params.tokenUser.updatedAt
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.user = params.user;
    oThis.tokenUser = params.tokenUser;
  }

  /**
   * Perform.
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    const uts = oThis.user.updatedAt > oThis.tokenUser.updatedAt ? oThis.user.updatedAt : oThis.tokenUser.updatedAt,
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
   * Get airdrop signup status.
   *
   * @return {number}
   * @private
   */
  _getSignupAirdropStatus(tokenUser) {
    const propertiesArray = new TokenUserModel().getBitwiseArray('properties', tokenUser.properties);
    if (propertiesArray.indexOf(tokenUserConstants.airdropDoneProperty) > -1) {
      return 1;
    }

    return 0;
  }
}

module.exports = UserFormatter;
