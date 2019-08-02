const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserContributionToStatsSingleFormatter = require(rootPrefix +
    '/lib/formatter/strategy/userContributionToStats/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user contribution to map formatter.
 *
 * @class UserContributionToStatsMapFormatter
 */
class UserContributionToStatsMapFormatter extends BaseFormatter {
  /**
   * Constructor for user contribution to map formatter.
   *
   * @param {object} params
   * @param {object} params.profileUserId
   * @param {object} params.contributionUsersByUserIdsMap
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.profileUserId = params.profileUserId;
    oThis.contributionUsersByUserIdsMap = params.contributionUsersByUserIdsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.contributionUsersByUserIdsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_ucts_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {
          object: oThis.contributionUsersByUserIdsMap
        }
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

    for (const userId in oThis.contributionUsersByUserIdsMap) {
      const contributionUser = oThis.contributionUsersByUserIdsMap[userId];

      const formattedUser = new UserContributionToStatsSingleFormatter({
        contributionUser: contributionUser
      }).perform();

      if (formattedUser.isFailure()) {
        return formattedUser;
      }

      finalResponse[userId] = formattedUser.data;
    }

    return responseHelper.successWithData({ [oThis.profileUserId]: finalResponse });
  }
}

module.exports = UserContributionToStatsMapFormatter;
