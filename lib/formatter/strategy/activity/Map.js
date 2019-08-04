const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ActivitySingleFormatter = require(rootPrefix + '/lib/formatter/strategy/activity/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for activities map formatter.
 *
 * @class ActivitiesMapFormatter
 */
class ActivitiesMapFormatter extends BaseFormatter {
  /**
   * Constructor for activities map formatter.
   *
   * @param {object} params
   * @param {object} params.activityMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.activityMap = params.activityMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.activityMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_e_f_m_1',
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

    for (const activityId in oThis.activityMap) {
      const activityObj = oThis.activityMap[activityId],
        formattedActivityRsp = new ActivitySingleFormatter({ activity: activityObj }).perform();

      if (formattedActivityRsp.isFailure()) {
        return formattedActivityRsp;
      }

      finalResponse[activityId] = formattedActivityRsp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = ActivitiesMapFormatter;
