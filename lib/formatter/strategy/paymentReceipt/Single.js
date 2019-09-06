const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user formatter.
 *
 * @class PaymentReceiptFormatter
 */
class PaymentReceiptFormatter extends BaseFormatter {
  /**
   * Constructor for user formatter.
   *
   * @param {object} params
   * @param {object} params.paymentReceipt
   *
   * @param {number} params.paymentReceipt.id
   * @param {number} params.paymentReceipt.rawReceipt
   * @param {string} params.user.status
   * @param {number} params.user.createdAt
   * @param {number} params.user.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.paymentReceipt = params.paymentReceipt;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    return responseHelper.successWithData({});
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData(oThis.paymentReceipt);
  }
}

module.exports = PaymentReceiptFormatter;
