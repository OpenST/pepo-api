const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ActivitySingleFormatter = require(rootPrefix + '/lib/formatter/strategy/activity/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for activities list formatter.
 *
 * @class ActivitiesListFormatter
 */
class ActivitiesListFormatter extends BaseFormatter {
  /**
   * Constructor for activities list formatter.
   *
   * @param {object} params
   * @param {array} params.activityIds
   * @param {object} params.activityMap
   *
   * @param {number} params.activities.id
   * @param {string} params.activities.kind
   * @param {string} params.activities.status
   * @param {number} params.activities.published_ts
   * @param {number} params.activities.updated_at
   * @param {object} params.activities.payload
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.activityIds = params.activityIds;
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

    if (!CommonValidators.validateArray(oThis.activityIds)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_e_f_l_1',
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

    for (let index = 0; index < oThis.activityIds.length; index++) {
      const activityId = oThis.activityIds[index],
        activityObj = oThis.activityMap[activityId];

      const formattedActivityRsp = new ActivitySingleFormatter({ activity: activityObj }).perform();

      if (formattedActivityRsp.isFailure()) {
        return formattedActivityRsp;
      }

      finalResponse.push(formattedActivityRsp.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = ActivitiesListFormatter;
