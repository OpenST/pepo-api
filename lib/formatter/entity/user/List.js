/**
 * Formatter for users entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/Users
 */

const rootPrefix = '../../../..',
  UserFormatter = require(rootPrefix + '/lib/formatter/entity/user/Single'),
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

    const finalResponse = [];

    for (let index = 0; index < oThis.userIds.length; index++) {
      const userId = oThis.userIds[index],
        user = oThis.usersByIdHash[userId],
        tokenUser = oThis.tokenUsersByUserIdHash[userId] || {};

      const formattedUser = new UserFormatter({ user: user, tokenUser: tokenUser }).perform();

      if (formattedUser.isFailure()) {
        return formattedUser;
      }

      finalResponse.push(formattedUser.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UsersFormatter;
