const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class CurrentUserUserContributionsFormatter extends BaseFormatter {
  /**
   * Constructor for user profile allowed actions formatter.
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
    const oThis = this;

    const currentUserUserContributionsKeyConfig = {
      id: { isNullAllowed: true },
      userId: { isNullAllowed: true },
      contributedByUserId: { isNullAllowed: true },
      totalAmount: { isNullAllowed: true },
      totalTransactions: { isNullAllowed: true },
      createdAt: { isNullAllowed: true }
    };

    return oThis._validateParameters(oThis.currentUserUserContributions, currentUserUserContributionsKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData(oThis.currentUserUserContributions.totalAmount);
  }
}

module.exports = CurrentUserUserContributionsFormatter;
