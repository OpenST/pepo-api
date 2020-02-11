const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType');

class TopupLimitDataFormatter extends BaseFormatter {
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

    oThis.limitsData = params[entityTypeConstants.topupLimitsData];
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
      limit_reached: { isNullAllowed: false },
      limit: { isNullAllowed: false }
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
      limit_reached: oThis.limitsData.limit_reached,
      limit: oThis.limitsData.limit
    });
  }
}

module.exports = TopupLimitDataFormatter;
