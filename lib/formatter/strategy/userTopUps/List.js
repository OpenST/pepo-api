const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserTopUpsSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/userTopUps/Single'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user topups list formatter.
 *
 * @class UserTopUpsListFormatter
 */
class UserTopUpsListFormatter extends BaseFormatter {
  /**
   * Constructor for userTopUps list formatter.
   *
   * @param {object} params
   * @param {array} params.userTopUpsList
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis[entityType.userTopUpsList] = params[entityType.userTopUpsList];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis[entityType.userTopUpsList])) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_e_utu_l_1',
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

    const finalResponse = [];

    for (let index = 0; index < oThis[entityType.userTopUpsList].length; index++) {
      const resp = new UserTopUpsSingleFormatter({
        userTopUp: oThis[entityType.userTopUpsList][index]
      }).perform();

      if (resp.isFailure()) {
        return resp;
      }

      finalResponse.push(resp.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UserTopUpsListFormatter;
