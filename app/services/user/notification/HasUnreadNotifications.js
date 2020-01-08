const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationModel = require(rootPrefix + '/app/models/cassandra/UserNotification'),
  UserNotificationVisitDetailModel = require(rootPrefix + '/app/models/cassandra/UserNotificationVisitDetail'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to check if user has unread notifications.
 *
 * @class HasUnreadNotifications
 */
class HasUnreadNotifications extends ServiceBase {
  /**
   * Constructor to check if user has unread notifications.
   *
   * @param {object} params
   * @param {number} params.user_id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userId = +params.user_id;
  }

  /**
   * Main performer for class.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateParams();

    return responseHelper.successWithData(await oThis._checkIfVisited());
  }

  /**
   * Validate parameters.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _validateParams() {
    const oThis = this;

    if (CommonValidators.isVarNullOrUndefined(oThis.userId)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_n_iv_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: { userId: oThis.userId }
        })
      );
    }
  }

  /**
   * Check if user has unread notifications.
   *
   * @returns {Promise<object>}
   * @private
   */
  async _checkIfVisited() {
    const oThis = this;

    const queryParams = {
      userId: oThis.userId
    };

    const promisesArray = [];

    promisesArray.push(new UserNotificationModel().fetchLatestLastActionTime(queryParams));
    promisesArray.push(new UserNotificationVisitDetailModel().fetchActivityLastVisitedAt(queryParams));

    const promisesResponse = await Promise.all(promisesArray);

    const userNotification = promisesResponse[0],
      lastActionTimestamp = userNotification.lastActionTimestamp || 0;

    const userNotificationVisitDetails = promisesResponse[1],
      lastVisitedAt = userNotificationVisitDetails.activityLastVisitedAt || 0;

    const finalRsp = { notificationUnread: { flag: 0 } };
    if (lastActionTimestamp && lastActionTimestamp > lastVisitedAt) {
      finalRsp.notificationUnread.flag = 1;
    }

    return finalRsp;
  }
}

module.exports = HasUnreadNotifications;
