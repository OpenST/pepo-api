const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  currentUserReplyDetailContributionSingleFormatter = require(rootPrefix +
    '/lib/formatter/strategy/currentUserReplyDetailContribution/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class currentUserReplyDetailContributionsMapFormatter extends BaseFormatter {
  /**
   * Constructor for current user reply detail contributions map formatter.
   *
   * @param {object} params
   * @param {object} params.currentUserReplyDetailContributionsMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserReplyDetailContributionsMap = params.currentUserReplyDetailContributionsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.currentUserReplyDetailContributionsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_curdc_1',
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

    for (const currentUserId in oThis.currentUserReplyDetailContributionsMap) {
      const currentUserReplyDetailContribution = oThis.currentUserReplyDetailContributionsMap[currentUserId],
        formattedCurrentUserReplyDetailContributionRsp = new currentUserReplyDetailContributionSingleFormatter({
          currentUserReplyDetailContributions: currentUserReplyDetailContribution
        }).perform();

      if (formattedCurrentUserReplyDetailContributionRsp.isFailure()) {
        return formattedCurrentUserReplyDetailContributionRsp;
      }

      finalResponse[currentUserId] = formattedCurrentUserReplyDetailContributionRsp.data.totalAmount;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = currentUserReplyDetailContributionsMapFormatter;
