const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/user/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user map formatter.
 *
 * @class UserMapFormatter
 */
class UserMapFormatter extends BaseFormatter {
  /**
   * Constructor for user map formatter.
   *
   * @param {object} params
   * @param {object} params.usersByIdMap
   * @param {object} params.tokenUsersByUserIdMap
   * @param {object} params.sanitizedRequestHeaders
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.usersByIdMap = params.usersByIdMap;
    oThis.tokenUsersByUserIdMap = params.tokenUsersByUserIdMap;
    oThis.requestHeaders = params.sanitizedRequestHeaders;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.usersByIdMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_e_u_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {
          object: oThis.usersByIdMap
        }
      });
    }

    if (!CommonValidators.validateObject(oThis.tokenUsersByUserIdMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_e_u_m_2',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {
          object: oThis.tokenUsersByUserIdMap
        }
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

    const finalResponse = {};

    for (const userId in oThis.usersByIdMap) {
      const userObj = oThis.usersByIdMap[userId],
        tokenUser = oThis.tokenUsersByUserIdMap[userId] || {};

      const formattedUser = new UserSingleFormatter({
        userId: userId,
        user: userObj,
        tokenUser: tokenUser,
        sanitizedRequestHeaders: oThis.requestHeaders
      }).perform();

      if (formattedUser.isFailure()) {
        return formattedUser;
      }

      finalResponse[userId] = formattedUser.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UserMapFormatter;
