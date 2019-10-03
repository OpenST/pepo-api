const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class CurrentUserUserContributionsFormatter extends BaseFormatter {
  /**
   * Constructor for current user user contributions formatter.
   *
   * @param {object} params
   * @param {object} params.currentUserUserContributions
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserUserContributions = params.currentUserUserContributions;
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
    const oThis = this,
      totalAmount = oThis.currentUserUserContributions.totalAmount || 0;

    return responseHelper.successWithData({ totalAmount: totalAmount });
  }
}

module.exports = CurrentUserUserContributionsFormatter;
