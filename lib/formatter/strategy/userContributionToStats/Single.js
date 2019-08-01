const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user contribution to stats formatter.
 *
 * @class UserContributionToStatsSingleFormatter
 */
class UserContributionToStatsSingleFormatter extends BaseFormatter {
  /**
   * Constructor for user contribution to stats formatter.
   *
   * @param {object} params
   * @param {object} params.contributionUser
   *
   * @param {number} params.contributionUser.id
   * @param {string} params.contributionUser.totalAmount
   * @param {number} params.contributionUser.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.contributionUser = params.contributionUser;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const contributionUserKeyConfig = {
      id: { isNullAllowed: false },
      totalAmount: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.contributionUser, contributionUserKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: Number(oThis.contributionUser.id),
      totalAmount: oThis.contributionUser.totalAmount,
      uts: Number(oThis.contributionUser.updatedAt)
    });
  }
}

module.exports = UserContributionToStatsSingleFormatter;
