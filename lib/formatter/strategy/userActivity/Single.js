const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  SingleActivityFormatter = require(rootPrefix + '/lib/formatter/strategy/activity/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Single User Activity entity to convert keys to snake case.
 *
 * @class UserActivitySingleFormatter
 */
class UserActivitySingleFormatter extends BaseFormatter {
  /**
   * Constructor for Single User Activity entity to convert keys to snake case.
   *
   * @param {object} params
   *
   * @param {object} params.activity
   * @param {number} params.activity.id
   * @param {string} params.activity.kind
   * @param {string} params.activity.status
   * @param {number} params.activity.display_ts
   * @param {number} params.activity.updated_at
   * @param {object} params.activity.payload
   *
   * @param {object} params.userActivity
   * @param {object} params.userActivity.publishedTs
   * @param {object} params.userActivity.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.activity = params.activity;
    oThis.userActivity = params.userActivity;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const userActivityKeyConfig = {
      publishedTs: { isNullAllowed: true },
      updatedAt: { isNullAllowed: false }
    };

    return oThis._validateParameters(oThis.userActivity, userActivityKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result|*}
   * @private
   */
  _format() {
    const oThis = this;

    const formattedActivityDataResp = new SingleActivityFormatter({ activity: oThis.activity }).perform();

    if (formattedActivityDataResp.isFailure()) {
      return formattedActivityDataResp;
    }

    const formattedActivityData = formattedActivityDataResp.data;

    formattedActivityData.id = oThis.userActivity.id;
    formattedActivityData.display_ts = oThis.userActivity.publishedTs;
    formattedActivityData.uts = oThis.userActivity.updatedAt;

    return responseHelper.successWithData(formattedActivityData);
  }
}

module.exports = UserActivitySingleFormatter;
