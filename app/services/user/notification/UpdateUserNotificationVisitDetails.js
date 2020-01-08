const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
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

    await oThis._validateParams();

    await oThis._updateUserNotificationVisitDetails();

    return responseHelper.successWithData({});
  }

  /**
   * Validate params
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateParams() {
    const oThis = this;
    if (CommonValidators.isVarNullOrUndefined(oThis.userId)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_n_uunvd_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: { userId: oThis.userId }
        })
      );
    }
    if (!CommonValidators.validateNonZeroInteger(oThis.lastVisitedAt)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_n_uunvd_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_last_visited_at'],
          debug_options: { lastVisitedAt: oThis.lastVisitedAt }
        })
      );
    }
  }

  /**
   * Update user notification visit details.
   *
   * @returns {Promise<any>}
   * @private
   */
  async _updateUserNotificationVisitDetails() {
    const oThis = this;

    const queryParams = {
      userId: oThis.userId,
      activityLastVisitedAt: oThis.lastVisitedAt
    };

    return new UserNotificationVisitDetailModel().updateActivityLastVisitTime(queryParams);
  }
}

module.exports = UpdateUserNotificationVisitDetails;
