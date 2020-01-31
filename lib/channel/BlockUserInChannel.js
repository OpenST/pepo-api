const rootPrefix = '../../',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  ChannelTagVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTagVideo'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  GetCurrentUserChannelRelationsLib = require(rootPrefix + '/lib/channel/getCurrentUserChannelRelations'),
  ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelUserByUserIdAndChannelIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos');

/**
 * Class to block user in a channel.
 *
 * @class BlockUserInChannel
 */
class BlockUserInChannel extends ServiceBase {
  /**
   * Constructor to block user in a channel.
   *
   * @param {object} params
   * @param {number} params.channel_id
   * @param {number} params.user_id_to_block
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelId = params.channel_id;
    oThis.userIdToBlock = params.user_id_to_block;

    oThis.channelUserObj = {};
    oThis.currentUserChannelRelationsMap = {};

    oThis.videoIdsToRemoveFromChannel = [];

    oThis.videosRemovedFromChannelCount = 0;

    oThis.channelTagIds = [];
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

    await Promise.all([oThis._blockChannelUser(), oThis._fetchActiveVideoIdsOfUser()]);

    await Promise.all([
      oThis._updateChannelStatTotalUsers(),
      oThis._deleteFromChannelVideos(),
      oThis._fetchTagIdsFromChannelTagVideo()
    ]);

    await Promise.all([
      oThis._deleteFromChannelTagVideos(),
      oThis._updateChannelStatTotalVideos(),
      oThis._clearVideoDetailsCache()
    ]);

    await oThis._fetchCurrentUserChannelRelations();

    return responseHelper.successWithData({
      [entityTypeConstants.currentUserChannelRelationsMap]: oThis.currentUserChannelRelationsMap
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
          internal_error_identifier: 'l_c_buic_1',
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
      userId: oThis.userIdToBlock,
      channelIds: [oThis.channelId]
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.channelUserObj = cacheResponse.data[oThis.channelId];

    if (!CommonValidators.validateNonEmptyObject(oThis.channelUserObj)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_c_buic_2',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId,
            userId: oThis.userIdToBlock
          }
        })
      );
    }

    if (oThis.channelUserObj.status === channelUsersConstants.inactiveStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_c_buic_3',
          api_error_identifier: 'user_inactive_in_channel',
          debug_options: {
            channelId: oThis.channelId,
            userId: oThis.userIdToBlock
          }
        })
      );
    }

    if (oThis.channelUserObj.status === channelUsersConstants.blockedStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_c_buic_4',
          api_error_identifier: 'user_blocked_in_channel',
          debug_options: {
            channelId: oThis.channelId,
            userId: oThis.userIdToBlock
          }
        })
      );
    }
  }

  /**
   * Block channel user.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _blockChannelUser() {
    const oThis = this;

    const updateParams = {
      role: channelUsersConstants.invertedRoles[channelUsersConstants.normalRole],
      status: channelUsersConstants.invertedStatuses[channelUsersConstants.blockedStatus],
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
   * Fetch active video ids of user.
   *
   * @sets oThis.videoIdsToRemoveFromChannel
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchActiveVideoIdsOfUser() {
    const oThis = this;

    const limit = 50;
    let pageNo = 1;
    let dbRowsLength = 1;

    // eslint-disable-next-line no-constant-condition
    while (dbRowsLength) {
      const offset = (pageNo - 1) * limit;

      const dbRows = await new VideoDetailModel()
        .select('video_id')
        .where({
          creator_user_id: oThis.userIdToBlock,
          status: videoDetailsConstants.invertedStatuses[videoDetailsConstants.activeStatus]
        })
        .limit(limit)
        .offset(offset)
        .fire();

      dbRowsLength = dbRows.length;

      if (dbRowsLength > 0) {
        for (let index = 0; index < dbRowsLength; index++) {
          oThis.videoIdsToRemoveFromChannel.push(dbRows[index].video_id);
        }

        pageNo += 1;
        if (dbRowsLength < limit) {
          dbRowsLength = 0;
        }
      } else {
        break;
      }
    }
  }

  /**
   * Update total users count in channel stat.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateChannelStatTotalUsers() {
    const oThis = this;

    await new ChannelStatModel()
      .update('total_users = total_users - 1')
      .where({ channel_id: oThis.channelId })
      .fire();

    await ChannelStatModel.flushCache({ channelIds: [oThis.channelId] });
  }

  /**
   * Delete video ids from channel videos table.
   *
   * @sets oThis.videosRemovedFromChannelCount
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteFromChannelVideos() {
    const oThis = this;

    if (oThis.videoIdsToRemoveFromChannel.length === 0) {
      return;
    }

    const updateResponse = await new ChannelVideoModel()
      .update({
        status: channelVideosConstants.invertedStatuses[channelVideosConstants.inactiveStatus],
        pinned_at: null
      })
      .where({ channel_id: oThis.channelId, video_id: oThis.videoIdsToRemoveFromChannel })
      .fire();

    oThis.videosRemovedFromChannelCount = updateResponse.affectedRows;

    if (oThis.videosRemovedFromChannelCount > 0) {
      await ChannelVideoModel.flushCache({ channelId: oThis.channelId });
    }
  }

  /**
   * Fetch tag ids for the given channel and video ids.
   *
   * @sets oThis.channelTagIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTagIdsFromChannelTagVideo() {
    const oThis = this;

    const dbRows = await new ChannelTagVideoModel()
      .select('tag_id')
      .where({ channel_id: oThis.channelId, video_id: oThis.videoIdsToRemoveFromChannel })
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      oThis.channelTagIds.push(dbRows[index].tag_id);
    }
  }

  /**
   * Delete entries from channel tag videos.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteFromChannelTagVideos() {
    const oThis = this;

    if (oThis.channelTagIds.length === 0) {
      return;
    }

    await new ChannelTagVideoModel()
      .delete()
      .where({ channel_id: oThis.channelId, video_id: oThis.videoIdsToRemoveFromChannel })
      .fire();

    const promisesArray = [];

    for (let index = 0; index < oThis.channelTagIds.length; index++) {
      promisesArray.push(
        ChannelTagVideoModel.flushCache({ channelId: oThis.channelId, tagId: oThis.channelTagIds[index] })
      );
    }

    await Promise.all(promisesArray);
  }

  /**
   * Update total videos count in channel stat.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateChannelStatTotalVideos() {
    const oThis = this;

    await new ChannelStatModel()
      .update(['total_videos = total_videos - ?', oThis.videosRemovedFromChannelCount])
      .where({ channel_id: oThis.channelId })
      .fire();

    await ChannelStatModel.flushCache({ channelIds: [oThis.channelId] });
  }

  /**
   * Clear video details cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _clearVideoDetailsCache() {
    const oThis = this;

    await VideoDetailModel.flushCache({ userId: oThis.userIdToBlock, videoIds: oThis.videoIdsToRemoveFromChannel });
  }

  /**
   * Fetch current user channel relations.
   *
   * @sets oThis.currentUserChannelRelationsMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchCurrentUserChannelRelations() {
    const oThis = this;

    const currentUserChannelRelationLibParams = {
      currentUserId: oThis.userIdToBlock,
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
}

module.exports = BlockUserInChannel;
