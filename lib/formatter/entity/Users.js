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
   * @param {Object} params.userId
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

    let finalResponse = [];

    for (let userId in oThis.params) {
      let user = oThis.params[userId],
        formattedUser = {};

      formattedUser[user.id] = {
        id: Number(user.id),
        first_name: user.firstName,
        last_name: user.lastName,
        ost_user_id: user.ostUserId,
        status: user.status,
        ost_token_holder_address: user.ostTokenHolderAddress || null,
        ost_status: user.ostStatus,
        uts: user.updatedAt
      };

      finalResponse.push(formattedUser);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UsersFormatter;
