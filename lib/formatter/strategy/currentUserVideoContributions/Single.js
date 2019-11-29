const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class CurrentUserVideoContributionsFormatter extends BaseFormatter {
  /**
   * Constructor for current user video contributions formatter.
   *
   * @param {object} params
   * @param {object} params.currentUserVideoContributions
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserVideoContributions = params.currentUserVideoContributions;
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
   * @returns {object}
   * @private
   */
  _format() {
    const oThis = this;

    const totalAmount = oThis.currentUserVideoContributions.totalAmount || 0;

    return responseHelper.successWithData({ totalAmount: totalAmount });
  }
}

module.exports = CurrentUserVideoContributionsFormatter;
