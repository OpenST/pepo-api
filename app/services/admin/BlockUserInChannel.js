const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  BlockUserFromChannel = require(rootPrefix + '/lib/channel/BlockUserInChannel'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs');

/**
 * Class to block user in a channel.
 *
 * @class BlockUserInChannel
 */
class BlockUserInChannel extends ServiceBase {
  /**
   * Constructor to block user in a channel
   *
   * @param {object} params
   * @param {array} params.user_id: User id to be blocked by admin.
   * @param {array} params.channel_id: Channel id.
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
    oThis.channelId = params.channel_id;
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

    await oThis._blockUserInChannel();

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
          internal_error_identifier: 'a_s_a_buic_1',
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
          internal_error_identifier: 'a_s_a_buic_2',
          api_error_identifier: 'could_not_proceed',
          params_error_identifiers: ['user_inactive'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Block user in channel.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _blockUserInChannel() {
    const oThis = this;

    await new BlockUserFromChannel({ channel_id: oThis.channelId, user_id_to_block: oThis.userId }).perform();
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
      action: adminActivityLogConstants.blockUserInChannel,
      extraData: JSON.stringify({ uId: oThis.userId, chId: oThis.channelId })
    });
  }
}

module.exports = BlockUserInChannel;
