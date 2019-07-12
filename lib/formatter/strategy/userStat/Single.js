const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class UserStatSingleFormatter extends BaseFormatter {
  /**
   * Constructor for UserStatSingleFormatter.
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

    if (basicHelper.isEmptyObject(oThis.userStat)) {
      oThis.userStat = {
        id: 0,
        userId: 0,
        totalContributedBy: 0,
        totalContributedTo: 0,
        totalAmountRaised: 0,
        createdAt: 0,
        updatedAt: 0
      };
      return responseHelper.successWithData({});
    }
    const userStatKeyConfig = {
      id: { isNullAllowed: false },
      userId: { isNullAllowed: false },
      totalContributedBy: { isNullAllowed: false },
      totalContributedTo: { isNullAllowed: false },
      totalAmountRaised: { isNullAllowed: false },
      createdAt: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis._validateParameters(oThis.userStat, userStatKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object|result}
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: oThis.userStat.id,
      user_id: oThis.userStat.userId,
      total_contributed_by: oThis.userStat.totalContributedBy,
      total_contributed_to: oThis.userStat.totalContributedTo,
      total_amount_raised_in_wei: oThis.userStat.totalAmountRaised,
      created_at: oThis.userStat.createdAt,
      updated_at: oThis.userStat.updatedAt
    });
  }
}

module.exports = UserStatSingleFormatter;
