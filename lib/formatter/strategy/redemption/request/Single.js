const rootPrefix = '../../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for redemption single formatter.
 *
 * @class RedemptionSingle
 */
class RedemptionSingle extends BaseFormatter {
  /**
   * Constructor for redemption single formatter.
   *
   * @param {object} params
   * @param {object} params.redemption
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.redemption = params.redemption;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const redemptionKeyConfig = {
      id: { isNullAllowed: false },
      productId: { isNullAllowed: false },
      userId: { isNullAllowed: false },
      uts: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.redemption, redemptionKeyConfig);
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
      id: oThis.redemption.id,
      user_id: oThis.redemption.userId,
      product_id: oThis.redemption.productId,
      uts: oThis.redemption.uts
    };

    return responseHelper.successWithData(response);
  }
}

module.exports = RedemptionSingle;
