const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserMuteModel = require(rootPrefix + '/app/models/mysql/UserMute'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  UserMuteByUser1IdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserMuteByUser1Ids'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user');

/**
 * Class to un mute user.
 *
 * @class UserUnMute
 */
class UserUnMute extends ServiceBase {
  /**
   * Constructor to un mute user.
   *
   * @param {object} params
   * @param {object} params.current_user: Current user object.
   * @param {object} params.user_id: User id to be unMuted.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserId = params.current_user.id;
    oThis.otherUserId = params.user_id;
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

    return responseHelper.successWithData({});
  }

  /**
   * Fetch users.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchUser() {
    const oThis = this;

    const cacheRsp = await new UsersCache({ ids: [oThis.currentUserId, oThis.otherUserId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    const currentUserObj = cacheRsp.data[oThis.currentUserId],
      otherUserObj = cacheRsp.data[oThis.otherUserId];

    if (currentUserObj.status !== userConstants.activeStatus || otherUserObj.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_um_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_inactive'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Fetch current mute state.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchCurrentMuteState() {
    const oThis = this;

    const cacheResponse = await new UserMuteByUser1IdsCache({ user1Ids: [oThis.currentUserId] }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    let cachedData = cacheResponse.data[oThis.currentUserId];

    if (!cachedData[oThis.otherUserId]) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_u_um_2',
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
      .where({ user2_id: oThis.otherUserId, user1_id: oThis.currentUserId })
      .fire();

    return UserMuteModel.flushCache({ user1Id: oThis.currentUserId });
  }
}

module.exports = UserUnMute;
