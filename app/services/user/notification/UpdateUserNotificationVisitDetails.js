const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserNotificationVisitDetailModel = require(rootPrefix + '/app/models/cassandra/UserNotificationVisitDetail'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for update user notification visit details.
 *
 * @class UpdateUserNotificationVisitDetails
 */
class UpdateUserNotificationVisitDetails extends ServiceBase {
  /**
   * Constructor for update user notification visit details.
   *
   * @param {object} params
   * @param {number} params.user_id
   * @param {number} params.last_visited_at
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userId = +params.user_id;
    oThis.lastVisitedAt = +params.last_visited_at;
  }

  /**
   * Main performer for class.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    // todo: validation

    await oThis._updateUserNotificationVisitDetails();

    responseHelper.successWithData({});
  }

  /**
   * Update user notification visit details.
   *
   * @returns {Promise<any>}
   * @private
   */
  async _updateUserNotificationVisitDetails() {
    const oThis = this;
    let queryParams = {
      userId: oThis.userId,
      lastVisitedAt: oThis.lastVisitedAt
    };
    return new UserNotificationVisitDetailModel().updateLastVisitTime(queryParams);
  }
}

module.exports = UpdateUserNotificationVisitDetails;
