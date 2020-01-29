const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  GetCurrentUserChannelRelationsLib = require(rootPrefix + '/lib/channel/getCurrentUserChannelRelations'),
  ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelUserByUserIdAndChannelIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
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
    oThis.currentUserChannelRelations = {};
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

    await oThis._removeChannelUser();

    await oThis._updateChannelStat();

    await oThis._fetchCurrentUserChannelRelations();

    return responseHelper.successWithData({
      currentUserChannelRelations: oThis.currentUserChannelRelations
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

    if (
      !CommonValidators.validateNonEmptyObject(oThis.channelUserObj) ||
      oThis.channelUserObj.status !== channelUsersConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_u_l_fcu_1',
          api_error_identifier: 'user_inactive_in_channel',
          debug_options: {
            channelId: oThis.channelId,
            userId: oThis.currentUser.id
          }
        })
      );
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

    await ChannelStatModel.flushCache({ channelId: oThis.channelId });
  }

  /**
   * Fetch current user channel relations
   *
   * @sets oThis.currentUserChannelRelations
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchCurrentUserChannelRelations() {
    const oThis = this;

    const currentUserChannelRelationLibParams = {
      currentUser: oThis.currentUser,
      channelIds: [oThis.channelId]
    };

    const currentUserChannelRelationsResponse = await new GetCurrentUserChannelRelationsLib(
      currentUserChannelRelationLibParams
    ).perform();
    if (currentUserChannelRelationsResponse.isFailure()) {
      return Promise.reject(currentUserChannelRelationsResponse);
    }

    oThis.currentUserChannelRelations = currentUserChannelRelationsResponse.data.currentUserChannelRelations;
  }
}

module.exports = LeaveChannel;
