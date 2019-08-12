const rootPrefix = '../../../..',
  UserNotificationServiceBase = require(rootPrefix + '/app/services/user/notification/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');
/**
 * Class for user Notification Single.
 *
 * @class UserNotification
 */
class UserNotificationSingle extends UserNotificationServiceBase {
  /**
   * Constructor for user contribution base.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number/string} params.current_user.id
   * @param {string} [params.userNotification]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userNotification = params.userNotification;
  }

  /**
   * Validate and sanitize specific params.
   *
   * @sets oThis.last_action_timestamp, oThis.limit
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    return;
  }

  /**
   * Fetch user notifications from cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setUserNotification() {
    const oThis = this;
    oThis.userNotifications = [oThis.userNotification];
  }

  /**
   * Service response.
   *
   * @returns {object}
   * @private
   */
  finalResponse() {
    const oThis = this;

    const response = super._finalResponse().data;

    response['userNotification'] = oThis.formattedUserNotifications[0];

    return responseHelper.successWithData(response);
  }
}

module.exports = UserNotificationSingle;
