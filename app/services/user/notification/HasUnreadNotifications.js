const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationModel = require(rootPrefix + '/app/models/cassandra/UserNotification'),
  UserNotificationVisitDetailModel = require(rootPrefix + '/app/models/cassandra/UserNotificationVisitDetail'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to check is user has unread notifications.
 *
 * @class HasUnreadNotifications
 */
class HasUnreadNotifications extends ServiceBase {
  /**
   * Constructor to check is user has unread notifications.
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
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateParams();

    return responseHelper.successWithData(await oThis._checkIfVisited());
  }

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
   * Check if user has unread notifications
   *
   * @returns {object}
   * @private
   */
  async _checkIfVisited() {
    const oThis = this;
    let finalRsp = {};

    const queryParams = {
      userId: oThis.userId
    };

    let userNotification = await new UserNotificationModel().fetchLatestLastActionTime(queryParams);
    let lastActionTimestamp = userNotification.lastActionTimestamp;

    let userNotificationVisitDetails = await new UserNotificationVisitDetailModel().fetchLastVisitedAt(queryParams);
    let lastVisitedAt = userNotificationVisitDetails.lastVisitedAt || 0;

    if (lastActionTimestamp) {
      if (lastActionTimestamp > lastVisitedAt) {
        finalRsp['unreadFlag'] = 1;
      } else {
        finalRsp['unreadFlag'] = 0;
      }
    }

    return finalRsp;
  }
}

module.exports = HasUnreadNotifications;
