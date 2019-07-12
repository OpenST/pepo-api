const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  UserActivitySingleFormatter = require(rootPrefix + '/lib/formatter/strategy/userActivity/Single');

/**
 * Class for User Activities entity to convert keys to snake case.
 *
 * @class UserActivitiesListFormatter
 */
class UserActivitiesListFormatter extends BaseFormatter {
  /**
   * Constructor for User Activities entity to convert keys to snake case.
   *
   * @param {object} params
   * @param {array} params.activityIds
   * @param {object} params.userActivityIdToActivityDetailsMap
   * @param {object} params.activityIdToActivityDetailsMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.activityIds = params.activityIds;
    oThis.userActivityIdToActivityDetailsMap = params.userActivityIdToActivityDetailsMap;
    oThis.activityIdToActivityDetailsMap = params.activityIdToActivityDetailsMap;
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
        internal_error_identifier: 'l_f_e_uf_l_1',
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
      const userActivityId = oThis.activityIds[index],
        userActivityObj = oThis.userActivityIdToActivityDetailsMap[userActivityId],
        activityObj = oThis.activityIdToActivityDetailsMap[userActivityId];

      const formattedActivityRsp = new UserActivitySingleFormatter({
        activity: activityObj,
        userActivity: userActivityObj
      }).perform();

      if (formattedActivityRsp.isFailure()) return formattedActivityRsp;

      finalResponse.push(formattedActivityRsp.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UserActivitiesListFormatter;
