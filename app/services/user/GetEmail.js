const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  UserEmailLogsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserEmailLogsByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType');

/**
 * Class to get email of current user.
 *
 * @class GetEmail
 */
class GetEmail extends ServiceBase {
  /**
   * Constructor to get email of current user.
   *
   * @param {object} params
   * @param {object} params.current_user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserId = params.current_user.id;

    oThis.email = {
      address: '',
      verified: false
    };
  }

  /**
   * Async perform.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis.getEmail();

    return responseHelper.successWithData({ [entityTypeConstants.email]: oThis.email });
  }

  /**
   * Get email for user.
   *
   * @sets oThis.email
   *
   * @returns {Promise<*|result>}
   */
  async getEmail() {
    const oThis = this;

    // Get email from users table.
    const userDetailsResponse = await new UserCache({ ids: [oThis.currentUserId] }).fetch();
    if (userDetailsResponse.isFailure()) {
      return Promise.reject(userDetailsResponse);
    }

    const userDetails = userDetailsResponse.data[oThis.currentUserId];
    // If email found in users table, update the values and return.
    if (userDetails.email) {
      oThis.email.address = userDetails.email;
      oThis.email.verified = true;

      return responseHelper.successWithData({});
    }

    // If email not found in users table, query user_email_logs table.
    const userEmailLogsResponse = await new UserEmailLogsByUserIdsCache({ userIds: [oThis.currentUserId] }).fetch();
    if (userEmailLogsResponse.isFailure()) {
      return Promise.reject(userEmailLogsResponse);
    }

    const userEmailLogDetails = userEmailLogsResponse.data[oThis.currentUserId];

    if (userEmailLogDetails.email) {
      // If email found in user_email_logs table, update the email address.
      oThis.email.address = userEmailLogDetails.email;

      return responseHelper.successWithData({});
    }
  }
}

module.exports = GetEmail;
