const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class RedemptionInfo extends BaseFormatter {
  /**
   * Constructor for recovery info formatter.
   *
   * @param {object} params
   * @param {string} params.scryptSalt: scrypt salt
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
