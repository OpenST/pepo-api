const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for limits data formatter.
 *
 * @class LimitsDataFormatter
 */
class LimitsDataFormatter extends BaseFormatter {
  /**
   * Constructor for device formatter.
   *
   * @param {object} params
   *
   * @param {string} params.limits_data
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.limitsData = params.limits_data;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const deviceKeyConfig = {
      monthly_limit_reached: { isNullAllowed: false },
      weekly_limit_reached: { isNullAllowed: false },
      daily_limit_reached: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.limitsData, deviceKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      monthly_limit_reached: oThis.limitsData.monthly_limit_reached,
      weekly_limit_reached: oThis.limitsData.weekly_limit_reached,
      daily_limit_reached: oThis.limitsData.daily_limit_reached
    });
  }
}

module.exports = LimitsDataFormatter;