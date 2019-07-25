const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  LoggedInUserSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/logged_in_user/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for logged in users list formatter.
 *
 * @class LoggedInUsersFormatter
 */
class LoggedInUsersFormatter extends BaseFormatter {
  /**
   * Constructor for logged in  users list formatter.
   *
   * @param {object} params
   * @param {array} params.userIds
   * @param {object} params.usersByIdMap
   * @param {object} params.tokenUsersByUserIdMap
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userIds = params.userIds;
    oThis.usersByIdMap = params.usersByIdMap;
    oThis.tokenUsersByUserIdMap = params.tokenUsersByUserIdMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis.userIds)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_liu_l_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { array: oThis.userIds }
      });
    }

    if (!CommonValidators.validateObject(oThis.usersByIdMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_liu_l_2',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { object: oThis.usersByIdMap }
      });
    }

    if (!CommonValidators.validateObject(oThis.tokenUsersByUserIdMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_liu_l_3',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { object: oThis.tokenUsersByUserIdMap }
      });
    }

    return responseHelper.successWithData({});
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    const finalResponse = [];

    for (let index = 0; index < oThis.userIds.length; index++) {
      const userId = oThis.userIds[index],
        user = oThis.usersByIdMap[userId],
        tokenUser = oThis.tokenUsersByUserIdMap[userId] || {};

      const formattedUser = new LoggedInUserSingleFormatter({ user: user, tokenUser: tokenUser }).perform();

      if (formattedUser.isFailure()) {
        return formattedUser;
      }

      finalResponse.push(formattedUser.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = LoggedInUsersFormatter;
