/**
 * Formatter for users entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/Users
 */

const rootPrefix = '../../..',
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
        tokenUser = oThis.tokenUsersByUserIdHash[userId] || {},
        formattedUser = {};

      let uts = user.updatedAt > tokenUser.updatedAt ? user.updatedAt : tokenUser.updatedAt;

      formattedUser = {
        id: Number(user.id),
        first_name: user.firstName,
        last_name: user.lastName,
        ost_user_id: tokenUser.ostUserId,
        status: user.status,
        ost_token_holder_address: tokenUser.ostTokenHolderAddress || null,
        ost_status: tokenUser.ostStatus,
        uts: uts
      };

      finalResponse.push(formattedUser);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UsersFormatter;
