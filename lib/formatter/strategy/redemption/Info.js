const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for redemption info formatter.
 *
 * @class RedemptionInfo
 */
class RedemptionInfo extends BaseFormatter {
  /**
   * Constructor for redemption info formatter.
   *
   * @param {object} params
   * @param {object} params.redemptionInfo
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.redemptionInfo = params.redemptionInfo;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const redemptionInfoKeyConfig = {
      id: { isNullAllowed: false },
      url: { isNullAllowed: false },
      uts: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.redemptionInfo, redemptionInfoKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData(oThis.redemptionInfo);
  }
}

module.exports = RedemptionInfo;
