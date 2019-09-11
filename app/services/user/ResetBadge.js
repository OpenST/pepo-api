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
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    logger.log('ResetBadge::params--------', params);

    oThis.currentUserId = +params.current_user.id;
  }

  /**
   * Main performer for class.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._resetUnreadNotificationsCount();

    return responseHelper.successWithData({});
  }

  /**
   * Resets unread notifications counts to zero.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _resetUnreadNotificationsCount() {
    const oThis = this;

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
