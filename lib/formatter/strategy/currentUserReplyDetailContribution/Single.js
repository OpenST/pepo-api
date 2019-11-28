const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class CurrentUserReplyDetailContributionSingleFormatter extends BaseFormatter {
  /**
   * Constructor for current user reply detail contributions formatter.
   *
   * @param {object} params
   * @param {object} params.currentUserReplyDetailContributions
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserReplyDetailContributions = params.currentUserReplyDetailContributions;
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
      totalAmount = oThis.currentUserReplyDetailContributions.totalAmount || 0;

    return responseHelper.successWithData({ totalAmount: totalAmount });
  }
}

module.exports = CurrentUserReplyDetailContributionSingleFormatter;
