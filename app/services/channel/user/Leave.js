const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  GetCurrentUserChannelRelationsLib = require(rootPrefix + '/lib/channel/GetCurrentUserChannelRelations'),
  ChannelStatByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelStatByChannelIds'),
  ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelUserByUserIdAndChannelIds'),
  AdminIdsByChannelIdCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/AdminIdsByChannelId'),
  ChannelIdsByUserCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelIdsByUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

/**
 * Class to remove user from a channel.
 *
 * @class LeaveChannel
 */
class LeaveChannel extends ServiceBase {
  /**
   * Constructor to remove user from a channel.
   *
   * @param {object} params
   * @param {number} params.channel_id
   * @param {object} params.current_user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUser = params.current_user;
    oThis.channelId = params.channel_id;

    oThis.channelUserObj = null;
    oThis.currentUserChannelRelationsMap = {};
    oThis.channelStatsMap = {};
    oThis.currentUserChannelRole = null;
    oThis.channelAdminIds = [];
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchChannel();

    await oThis._fetchChannelUser();

    if (
      !CommonValidators.validateNonEmptyObject(oThis.channelUserObj) ||
      oThis.channelUserObj.status !== channelUsersConstants.activeStatus
    ) {
      await oThis._fetchCurrentUserChannelRelations();
      await oThis._fetchChannelStats();

      return responseHelper.successWithData({
        [entityTypeConstants.currentUserChannelRelationsMap]: oThis.currentUserChannelRelationsMap,
        [entityTypeConstants.channelStatsMap]: oThis.channelStatsMap
      });
    }

    await oThis._checkUserCanLeave();

    await oThis._removeChannelUser();

    await oThis._updateChannelStat();

    await Promise.all([
      oThis._fetchCurrentUserChannelRelations(),
      oThis._fetchChannelStats(),
      oThis._changeUserProperty()
    ]);

    return responseHelper.successWithData({
      [entityTypeConstants.currentUserChannelRelationsMap]: oThis.currentUserChannelRelationsMap,
      [entityTypeConstants.channelStatsMap]: oThis.channelStatsMap
    });
  }

  /**
   * Fetch and validate channel.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchChannel() {
    const oThis = this;

    const cacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const channelObj = cacheResponse.data[oThis.channelId];

    if (!CommonValidators.validateNonEmptyObject(channelObj) || channelObj.status !== channelConstants.activeStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_u_l_fc_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId
          }
        })
      );
    }
  }

  /**
   * Fetch and validate channel user.
   *
   * @sets oThis.channelUserObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchChannelUser() {
    const oThis = this;

    const cacheResponse = await new ChannelUserByUserIdAndChannelIdsCache({
      userId: oThis.currentUser.id,
      channelIds: [oThis.channelId]
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.channelUserObj = cacheResponse.data[oThis.channelId];
    oThis.currentUserChannelRole = oThis.channelUserObj.role;
  }

  /**
   * Check if user can leave channel.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _checkUserCanLeave() {
    const oThis = this;

    if (oThis.channelUserObj.role === channelUsersConstants.adminRole) {
      const adminIdsByChannelIdCacheResponse = await new AdminIdsByChannelIdCache({
        channelIds: [oThis.channelId]
      }).fetch();

      oThis.channelAdminIds = adminIdsByChannelIdCacheResponse.data[oThis.channelId];

      if (oThis.channelAdminIds && oThis.channelAdminIds.length === 1) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'a_s_c_u_l_cucl_1',
            api_error_identifier: 'can_not_leave_channel',
            debug_options: {
              channelId: oThis.channelId,
              userId: oThis.currentUser.id
            }
          })
        );
      }
    }
  }

  /**
   * Remove channel user.
   *
   * @sets oThis.channelUserObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _removeChannelUser() {
    const oThis = this;

    const updateParams = {
      role: channelUsersConstants.invertedRoles[channelUsersConstants.normalRole],
      status: channelUsersConstants.invertedStatuses[channelUsersConstants.inactiveStatus],
      notification_status:
        channelUsersConstants.invertedNotificationStatuses[channelUsersConstants.inactiveNotificationStatus]
    };

    const updateResponse = await new ChannelUserModel()
      .update(updateParams)
      .where({ id: oThis.channelUserObj.id })
      .fire();

    Object.assign(updateParams, updateResponse.defaultUpdatedAttributes);

    const formattedUpdatedParams = new ChannelUserModel().formatDbData(updateParams);
    Object.assign(oThis.channelUserObj, formattedUpdatedParams);

    await ChannelUserModel.flushCache(oThis.channelUserObj);
  }

  /**
   * Update channel stat.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateChannelStat() {
    const oThis = this;

    await new ChannelStatModel()
      .update('total_users = total_users - 1')
      .where({ channel_id: oThis.channelId })
      .fire();

    await ChannelStatModel.flushCache({ channelIds: [oThis.channelId] });
  }

  /**
   * Fetch current user channel relations
   *
   * @sets oThis.currentUserChannelRelationsMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchCurrentUserChannelRelations() {
    const oThis = this;

    const currentUserChannelRelationLibParams = {
      currentUserId: oThis.currentUser.id,
      channelIds: [oThis.channelId]
    };

    const currentUserChannelRelationsResponse = await new GetCurrentUserChannelRelationsLib(
      currentUserChannelRelationLibParams
    ).perform();
    if (currentUserChannelRelationsResponse.isFailure()) {
      return Promise.reject(currentUserChannelRelationsResponse);
    }

    oThis.currentUserChannelRelationsMap = currentUserChannelRelationsResponse.data.currentUserChannelRelations;
  }

  /**
   * Fetch channel stats.
   *
   * @sets oThis.channelStatsMap
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchChannelStats() {
    const oThis = this;

    const cacheResponse = await new ChannelStatByChannelIdsCache({ channelIds: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.channelStatsMap = cacheResponse.data;

    if (!CommonValidators.validateNonEmptyObject(oThis.channelStatsMap[oThis.channelId])) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_u_l_fcs_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId,
            channelStats: oThis.channelStatsMap[oThis.channelId]
          }
        })
      );
    }
  }

  /**
   * Unset isManagingChannelProperty if user is admin.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _changeUserProperty() {
    const oThis = this;

    if (oThis.currentUserChannelRole === channelUsersConstants.adminRole) {
      const channelIdsByUserIdsCacheResponse = await new ChannelIdsByUserCache({
        userIds: [oThis.currentUser.id]
      }).fetch();

      if (channelIdsByUserIdsCacheResponse.isFailure()) {
        return Promise.reject(channelIdsByUserIdsCacheResponse);
      }

      const channelIdsArray =
        channelIdsByUserIdsCacheResponse.data[oThis.currentUser.id][channelUsersConstants.adminRole] || [];

      if (channelIdsArray.length == 0) {
        await new UserModel().unmarkUserChannelAdmin([oThis.currentUser.id]);
        await new SecureUserCache({ id: oThis.currentUser.id }).clear();
      }
    }
  }
}

module.exports = LeaveChannel;
