const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserMuteModel = require(rootPrefix + '/app/models/mysql/UserMute'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/admin/AdminActivityLog'),
  UserMuteByUser2IdsForGlobalCache = require(rootPrefix + '/lib/cacheManagement/multi/UserMuteByUser2IdsForGlobal'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/admin/adminActivityLogs');

/**
 * Class to un mute user by admin.
 *
 * @class UnMuteUser
 */
class UnMuteUser extends ServiceBase {
  /**
   * Constructor to un mute user by admin.
   *
   * @param {object} params
   * @param {array} params.user_id: User id to be mute by admin.
   * @param {object} params.current_admin: current admin.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userId = params.user_id;
    oThis.currentAdminId = params.current_admin.id;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchUser();

    await oThis._fetchCurrentMuteState();

    await oThis._unMuteUser();

    await oThis._logAdminActivity();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch users.
   *
   * @sets oThis.userObjects
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchUser() {
    const oThis = this;

    const cacheRsp = await new UsersCache({ ids: [oThis.userId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_umu_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: { userId: oThis.userId }
        })
      );
    }

    const userObj = cacheRsp.data[oThis.userId];

    if (userObj.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_umu_2',
          api_error_identifier: 'could_not_proceed',
          params_error_identifiers: ['user_inactive'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Fetch current mute state
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchCurrentMuteState() {
    const oThis = this;

    const cacheResponse = await new UserMuteByUser2IdsForGlobalCache({ user2Ids: [oThis.userId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const isUserAlreadyUnMuted = cacheResponse.data[oThis.userId].all == 0;

    if (isUserAlreadyUnMuted) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_a_mu_3',
          api_error_identifier: 'user_already_unmuted',
          debug_options: {}
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Unmute user.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _unMuteUser() {
    const oThis = this;

    await new UserMuteModel()
      .delete()
      .where({ user2_id: oThis.userId, user1_id: 0 })
      .fire();

    return UserMuteModel.flushCache({ user2Id: oThis.userId });
  }

  /**
   * Log admin activity.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _logAdminActivity() {
    const oThis = this;

    return new AdminActivityLogModel().insertAction({
      adminId: oThis.currentAdminId,
      actionOn: oThis.userId,
      action: adminActivityLogConstants.unMuteUser
    });
  }
}

module.exports = UnMuteUser;
