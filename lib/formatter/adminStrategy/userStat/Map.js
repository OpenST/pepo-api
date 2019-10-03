const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  userStatSingleFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/userStat/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class UserStatsMapFormatter extends BaseFormatter {
  /**
   * Constructor for user stats map formatter.
   *
   * @param {object} params
   * @param {object} params.userStat
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userStat = params.userStat;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.userStat)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_as_us_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { userStat: oThis.userStat }
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

    for (const userId in oThis.userStat) {
      const userStatObj = oThis.userStat[userId],
        formattedUserStat = new userStatSingleFormatter({ userStat: userStatObj }).perform();

      if (formattedUserStat.isFailure()) {
        return formattedUserStat;
      }

      finalResponse[userId] = formattedUserStat.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UserStatsMapFormatter;
