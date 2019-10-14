const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for PepocornTopUp single formatter.
 *
 * @class PepocornTopUpSingle
 */
class PepocornTopUpSingle extends BaseFormatter {
  /**
   * Constructor for PepocornTopUp single formatter.
   *
   * @param {object} params
   * @param {object} params.pepocornTopupInfo
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.pepocornTopupInfo = params.pepocornTopupInfo;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const KeyConfig = {
      productId: { isNullAllowed: false },
      name: { isNullAllowed: false },
      productStepFactor: { isNullAllowed: false },
      pepoInOneStepFactor: { isNullAllowed: false },
      dollarInOneStepFactor: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.pepocornTopupInfo, KeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    const response = {
      id: oThis.pepocornTopupInfo.productId,
      product_id: oThis.pepocornTopupInfo.productId,
      product_name: oThis.pepocornTopupInfo.name,
      step: oThis.pepocornTopupInfo.productStepFactor,
      pepo_in_wei_per_step: oThis.pepocornTopupInfo.pepoInOneStepFactor,
      dollar_per_step: oThis.pepocornTopupInfo.dollarInOneStepFactor,
      uts: Math.floor(new Date().getTime() / 1000)
    };

    return responseHelper.successWithData(response);
  }
}

module.exports = PepocornTopUpSingle;
