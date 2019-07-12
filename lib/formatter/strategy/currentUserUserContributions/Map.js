const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  currentUserUserContributionSingleFormatter = require(rootPrefix +
    '/lib/formatter/strategy/currentUserUserContributions/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class currentUserUserContributionMapFormatter extends BaseFormatter {
  /**
   * Constructor for videos map formatter.
   *
   * @param {object} params
   * @param {object} params.currentUserUserContributionsMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserUserContributionsMap = params.currentUserUserContributionsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.currentUserUserContributionsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_cuuc_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {}
      });
    }

    return responseHelper.successWithData({});
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    const finalResponse = {};

    for (const currentUserId in oThis.currentUserUserContributionsMap) {
      const currentUserUserContribution = oThis.currentUserUserContributionsMap[currentUserId],
        formattedCurrentUserUserContributionRsp = new currentUserUserContributionSingleFormatter({
          currentUserUserContributions: currentUserUserContribution
        }).perform();

      if (formattedCurrentUserUserContributionRsp.isFailure()) {
        return formattedCurrentUserUserContributionRsp;
      }

      finalResponse[currentUserId] = formattedCurrentUserUserContributionRsp.data.totalAmount;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = currentUserUserContributionMapFormatter;
