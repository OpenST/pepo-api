const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelIdsByUserCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelIdsByUser'),
  ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelUserByUserIdAndChannelIds'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

/**
 * Class to change channel user role.
 *
 * @class ChangeChannelUserRole
 */
class ChangeChannelUserRole {
  /**
   * Constructor to change channel user role.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.channelId
   * @param {string} params.role
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.channelId = params.channelId;
    oThis.role = params.role;

    oThis.isChannelUser = false;
    oThis.channelUserObj = {};
    oThis.user = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._validate();

    await oThis._checkIfChannelUser();

    await oThis._changeRole();

    await oThis._changeUsersProperty();
  }

  /**
   * Validate input parameters.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validate() {
    const oThis = this;

    // Validate channel id.
    const cacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const channelObj = cacheResponse.data[oThis.channelId];

    if (!CommonValidator.validateNonEmptyObject(channelObj) || channelObj.status !== channelConstants.activeStatus) {
      return Promise.reject(new Error('===== Invalid channel id ======='));
    }

    oThis.user = await new UserModel().fetchById(oThis.userId);
    // TODO: Use cache.

    if (!CommonValidator.validateNonEmptyObject(oThis.user) || oThis.user.status !== userConstants.activeStatus) {
      return Promise.reject(new Error('=== Not a valid user ==='));
    }

    // Check for valid role.
    if (!channelUsersConstants.invertedRoles[oThis.role]) {
      return Promise.reject(new Error('===== Invalid role ====='));
    }
  }

  /**
   * Check if channel user.
   *
   * @sets oThis.isChannelUser, oThis.channelUserObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _checkIfChannelUser() {
    const oThis = this;

    const cacheRsp = await new ChannelUserByUserIdAndChannelIdsCache({
      userId: oThis.userId,
      channelIds: [oThis.channelId]
    }).fetch();

    if (CommonValidator.validateNonEmptyObject(cacheRsp.data[oThis.channelId])) {
      oThis.isChannelUser = true;
      oThis.channelUserObj = cacheRsp.data[oThis.channelId];
    }
  }

  /**
   * Change role in channel users table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _changeRole() {
    const oThis = this;

    let queryParams;

    if (oThis.isChannelUser) {
      queryParams = {
        role: channelUsersConstants.invertedRoles[oThis.role],
        status: channelUsersConstants.invertedStatuses[channelUsersConstants.activeStatus]
      };
      await new ChannelUserModel()
        .update(queryParams)
        .where({
          user_id: oThis.userId,
          channel_id: oThis.channelId
        })
        .fire();

      // We need to update channelStats in this scenario.
      if (oThis.channelUserObj.status === channelUsersConstants.inactiveStatus) {
        await oThis._updateChannelStats();
      }
    } else {
      queryParams = {
        user_id: oThis.userId,
        channel_id: oThis.channelId,
        notification_status:
          channelUsersConstants.invertedNotificationStatuses[channelUsersConstants.activeNotificationStatus],
        status: channelUsersConstants.invertedStatuses[channelUsersConstants.activeStatus],
        role: channelUsersConstants.invertedRoles[oThis.role]
      };
      await new ChannelUserModel().insert(queryParams).fire();

      await oThis._updateChannelStats();
    }

    queryParams = {
      ...queryParams,
      user_id: oThis.userId,
      channel_id: oThis.channelId
    };
    const formatDbData = new ChannelUserModel().formatDbData(queryParams);
    await ChannelUserModel.flushCache(formatDbData);
  }

  /**
   * Mark or unmark channel admin as userManagingChannel in users table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _changeUsersProperty() {
    const oThis = this;

    if (oThis.role === channelUsersConstants.adminRole) {
      await new UserModel().markUserChannelAdmin([oThis.userId]);
    } else {
      // If we are changing channel user's role to normal, check if he is admin of any other channel.
      // If yes dont remove `isManagingChannelProperty`.
      const channelIdsByUserIdsCacheResponse = await new ChannelIdsByUserCache({ userIds: [oThis.userId] }).fetch();

      if (channelIdsByUserIdsCacheResponse.isFailure()) {
        return Promise.reject(channelIdsByUserIdsCacheResponse);
      }

      const channelIdsArray = channelIdsByUserIdsCacheResponse.data[oThis.userId][channelUsersConstants.adminRole];

      if (channelIdsArray.length === 0) {
        await new UserModel().unmarkUserChannelAdmin([oThis.userId]);
      }
    }
    await UserModel.flushCache({ id: oThis.userId, userName: oThis.user.userName, email: oThis.user.email });
  }

  /**
   * Update channel stats.
   *
   * @returns {Promise}
   * @private
   */
  async _updateChannelStats() {
    const oThis = this;

    await new ChannelStatModel()
      .update('total_users = total_users + 1')
      .where({ channel_id: oThis.channelId })
      .fire();

    await ChannelStatModel.flushCache({ channelIds: [oThis.channelId] });
  }
}

module.exports = ChangeChannelUserRole;
