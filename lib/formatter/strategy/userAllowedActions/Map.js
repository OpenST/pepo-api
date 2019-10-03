const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserAllowedActionsSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/userAllowedActions/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for videos map formatter.
 *
 * @class UserAllowedActions
 */
class UserAllowedActions extends BaseFormatter {
  /**
   * Constructor for videos map formatter.
   *
   * @param {object} params
   * @param {object} params.userProfileAllowedActions
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userAllowedActionsMap = params.userProfileAllowedActions;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.userAllowedActionsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_uaa_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {}
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

    for (const userId in oThis.userAllowedActionsMap) {
      const userAllowedActionsObj = oThis.userAllowedActionsMap[userId],
        userAllowedActionsRsp = new UserAllowedActionsSingleFormatter({
          userAllowedAction: userAllowedActionsObj
        }).perform();

      if (userAllowedActionsRsp.isFailure()) {
        return userAllowedActionsRsp;
      }

      finalResponse[userId] = userAllowedActionsRsp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UserAllowedActions;
