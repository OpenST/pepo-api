/**
 * Formatter for users entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/Users
 */

const rootPrefix = '../../../..',
  UserFormatter = require(rootPrefix + '/lib/formatter/entity/User'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user formatter.
 *
 * @class
 */
class UsersFormatter {
  /**
   * Constructor for users formatter.
   *
   * @param {Object} params
   * @param {Array} params.userIds
   * @param {Object} params.usersByIdHash
   * @param {Object} params.tokenUsersByUserIdHash
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userIds = params.userIds;
    oThis.usersByIdHash = params.usersByIdHash;
    oThis.tokenUsersByUserIdHash = params.tokenUsersByUserIdHash;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    let finalResponse = [];

    for (let i = 0; i < oThis.userIds.length; i++) {
      let userId = oThis.userIds[i],
        user = oThis.usersByIdHash[userId],
        tokenUser = oThis.tokenUsersByUserIdHash[userId] || {};

      let formattedUser = new UserFormatter({ user: user, tokenUser: tokenUser }).perform();
      finalResponse.push(formattedUser.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UsersFormatter;
