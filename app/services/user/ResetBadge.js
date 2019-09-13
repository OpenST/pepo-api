const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserNotificationsCountModel = require(rootPrefix + '/app/models/cassandra/UserNotificationsCount'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to add ResetBadge.
 *
 * @class ResetBadge
 */
class ResetBadge extends ServiceBase {
  /**
   * Constructor to add device token.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number} params.user_id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.currentUserId = +params.current_user.id;
    oThis.userId = +params.user_id;
  }

  /**
   * Main performer for class.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    await oThis._resetUnreadNotificationsCount();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize params.
   *
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    if (oThis.currentUserId !== oThis.userId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_rb_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: { currentUserId: oThis.currentUserId }
        })
      );
    }
  }

  /**
   * Resets unread notifications counts to zero.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _resetUnreadNotificationsCount() {
    const oThis = this;

    //NOTE: Optimization- Try delete row for resetting the data
    let queryRsp = await new UserNotificationsCountModel().fetchUnreadNotificationCount({
      userIds: [oThis.currentUserId]
    });

    logger.log('queryRsp ======', queryRsp);

    return new UserNotificationsCountModel().resetUnreadNotificationCount({
      userId: oThis.currentUserId,
      count: queryRsp[oThis.currentUserId]
    });
  }
}

module.exports = ResetBadge;
