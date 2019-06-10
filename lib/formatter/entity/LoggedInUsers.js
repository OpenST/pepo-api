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

    let formattedData = {};

    for (let userId in oThis.params) {
      let user = oThis.params[userId];

      const formattedUserData = {
        id: Number(user.id),
        first_name: user.firstName,
        last_name: user.lastName,
        status: user.status,
        uts: user.updatedAt,
        ost_user_id: user.ostUserId,
        ost_token_holder_address: user.ostTokenHolderAddress || null,
        ost_token_user_status: user.ostStatus
      };

      formattedData[userId] = formattedUserData;
    }

    return responseHelper.successWithData(formattedData);
  }
}

module.exports = LoggedInUserFormatter;
