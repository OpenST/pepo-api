/**
 * Formatter for Users entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/user/Map
 */

const rootPrefix = '../../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  UserSingleFormatter = require(rootPrefix + '/lib/formatter/entity/user/Single');

/**
 * Class for user map formatter.
 *
 * @class UserMapFormatter
 */
class UserMapFormatter {
  /**
   * Constructor for user map formatter.
   *
   * @param {object} params
   * @param {object} params.usersByIdMap
   * @param {object} params.tokenUsersByUserIdMap
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.usersByIdMap = params.usersByIdMap;
    oThis.tokenUsersByUserIdMap = params.tokenUsersByUserIdMap;
  }

  /**
   * Perform.
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    const finalResponse = {};

    for (const userId in oThis.usersByIdMap) {
      const userObj = oThis.usersByIdMap[userId],
        tokenUser = oThis.tokenUsersByUserIdMap[userId] || {};

      const formattedUser = new UserSingleFormatter({ user: userObj, tokenUser: tokenUser }).perform();

      finalResponse[userId] = formattedUser.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UserMapFormatter;
