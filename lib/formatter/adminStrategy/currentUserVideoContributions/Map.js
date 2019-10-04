const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  currentUserVideoContributionSingleFormatter = require(rootPrefix +
    '/lib/formatter/adminStrategy/currentUserVideoContributions/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class currentUserVideoContributionMapFormatter extends BaseFormatter {
  /**
   * Constructor for current user video contributions map formatter.
   *
   * @param {object} params
   * @param {object} params.currentUserVideoContributionsMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserVideoContributionsMap = params.currentUserVideoContributionsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.currentUserVideoContributionsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_as_cuvc_1',
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

    for (const currentUserId in oThis.currentUserVideoContributionsMap) {
      const currentUserVideoContribution = oThis.currentUserVideoContributionsMap[currentUserId],
        formattedCurrentUserVideoContributionRsp = new currentUserVideoContributionSingleFormatter({
          currentUserVideoContributions: currentUserVideoContribution
        }).perform();

      if (formattedCurrentUserVideoContributionRsp.isFailure()) {
        return formattedCurrentUserVideoContributionRsp;
      }

      finalResponse[currentUserId] = formattedCurrentUserVideoContributionRsp.data.totalAmount;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = currentUserVideoContributionMapFormatter;
