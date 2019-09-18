const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType');

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

    oThis.limitsData = params[entityType.topupLimitsData];
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
      lifetime_limit_reached: { isNullAllowed: false }
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
      lifetime_limit_reached: oThis.limitsData.lifetime_limit_reached
    });
  }
}

module.exports = TopupLimitDataFormatter;
