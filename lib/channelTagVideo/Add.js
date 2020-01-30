const rootPrefix = '../..',
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  ChannelTagVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTagVideo'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  util = require(rootPrefix + '/lib/util'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos');

/**
 * Class to remove channel tag videos.
 *
 * @class AddChannelTagVideo
 */
class AddChannelTagVideo {
  /**
   * Constructor to remove channel tag videos.
   *
   * @param {object} params
   * @param {object} params.channelIdToVideoTagsMap {c1: {v1: [t1,t2]}, c2: {v1: [t2,t3], v2: [t2,t4]}}
   * @param {object} params.videoIdTagIdToVideoDetailsMap
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.channelIdToVideoTagsMap = params.channelIdToVideoTagsMap;
    oThis.videoIdTagIdToVideoDetailsMap = params.videoIdTagIdToVideoDetailsMap;

    oThis.channelIds = [];
    oThis.videoIds = [];

    oThis.activeChannelVideos = {};
    oThis.inActiveChannelVideos = {};

    oThis.insertChannelIdVideoIdMap = {};
    oThis.markActiveChannelIdVideoIdMap = {};

    oThis.newVideosInChannel = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    oThis._createChannelIdsAndVideoIdsArray();

    await oThis._fetchChannelVideos();

    await oThis._insertInChannelTagVideo();

    await oThis._insertInChannelVideo();

    await oThis._markChannelVideosActive();

    await oThis._updateChannelStats();

    await oThis._clearChannelVideoCache();

    await oThis._clearVideoDetailsCache();

    return responseHelper.successWithData({});
  }

  /**
   * Create channelIds and videoIds array.
   *
   * @sets oThis.channelIds, oThis.videoIds
   *
   * @private
   */
  _createChannelIdsAndVideoIdsArray() {
    const oThis = this;

    for (const channelId in oThis.channelIdToVideoTagsMap) {
      oThis.channelIds.push(channelId);
      const videoIdToTagIdsArray = oThis.channelIdToVideoTagsMap[channelId];
      for (const videoId in videoIdToTagIdsArray) {
        oThis.videoIds.push(videoId);
      }
    }

    // remove duplicate videoIds.
    oThis.videoIds = [...new Set(oThis.videoIds)];
  }

  /**
   * Fetch active channel videos.
   *
   * @sets oThis.activeChannelVideos, oThis.inActiveChannelVideos
   * @returns {Promise<never>}
   * @private
   */
  async _fetchChannelVideos() {
    const oThis = this;

    if (oThis.channelIds.length === 0 || oThis.videoIds.length === 0) {
      return Promise.reject(new Error('Invalid input parameters.'));
    }

    const channelVideoDbRows = await new ChannelVideoModel()
      .select('*')
      .where({
        channel_id: oThis.channelIds,
        video_id: oThis.videoIds
      })
      .fire();

    for (let index = 0; index < channelVideoDbRows.length; index++) {
      const channelVideoRow = channelVideoDbRows[index];

      const channelVideoKey = oThis._getChannelIdAndVideoIdMapKey(channelVideoRow.channel_id, channelVideoRow.video_id);
      if (channelVideoRow.status == channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus]) {
        oThis.activeChannelVideos[channelVideoKey] = { pinnedAt: channelVideoRow.pinned_at };
      } else {
        oThis.inActiveChannelVideos[channelVideoKey] = {};
      }
    }
  }

  /**
   * Multi insert in  channel tag video.
   *
   * @sets oThis.markActiveChannelIdVideoIdMap, oThis.insertChannelIdVideoIdMap
   * @returns {Promise<void>}
   * @private
   */
  async _insertInChannelTagVideo() {
    const oThis = this;

    const insertColumns = ['channel_id', 'tag_id', 'video_id', 'pinned_at', 'created_at', 'updated_at'],
      insertValues = [],
      channelTagIdsMap = {};

    for (let channelId in oThis.channelIdToVideoTagsMap) {
      const videoIdToTagIdsArray = oThis.channelIdToVideoTagsMap[channelId];
      for (const videoId in videoIdToTagIdsArray) {
        let channelVideoTags = videoIdToTagIdsArray[videoId],
          channelVideoKey = oThis._getChannelIdAndVideoIdMapKey(channelId, videoId),
          channelVideo = oThis.activeChannelVideos[channelVideoKey],
          pinnedAt = channelVideo && channelVideo.pinnedAt ? channelVideo.pinnedAt : 0;

        if (!channelVideoTags || channelVideoTags.length <= 0) {
          continue;
        }

        if (oThis.inActiveChannelVideos[channelVideoKey]) {
          oThis.markActiveChannelIdVideoIdMap[channelId] = oThis.markActiveChannelIdVideoIdMap[channelId] || [];
          oThis.markActiveChannelIdVideoIdMap[channelId].push(videoId);
        } else if (!oThis.activeChannelVideos[channelVideoKey]) {
          oThis.insertChannelIdVideoIdMap[channelId] = oThis.insertChannelIdVideoIdMap[channelId] || [];
          oThis.insertChannelIdVideoIdMap[channelId].push(videoId);
        }
        channelTagIdsMap[channelId] = channelTagIdsMap[channelId] || [];
        channelTagIdsMap[channelId] = channelTagIdsMap[channelId].concat(channelVideoTags);

        for (let i = 0; i < channelVideoTags.length; i++) {
          let tagId = channelVideoTags[i],
            videoTagKey = util.getVideoIdAndTagIdMapKey(videoId, tagId),
            createdAt = oThis.videoIdTagIdToVideoDetailsMap[videoTagKey]
              ? oThis.videoIdTagIdToVideoDetailsMap[videoTagKey].createdAt
              : basicHelper.getCurrentTimestampInSeconds();

          insertValues.push([channelId, tagId, videoId, pinnedAt, createdAt, createdAt]);
        }
      }
    }

    await new ChannelTagVideoModel()
      .insertMultiple(insertColumns, insertValues, { touch: false, withIgnore: true })
      .fire();

    await oThis._clearChannelTagVideoCache(channelTagIdsMap);

    return responseHelper.successWithData({});
  }

  /**
   * Insert in channel_videos table
   *
   * @Sets oThis.newVideosInChannel
   * @returns {Promise<*|result>}
   * @private
   */
  async _insertInChannelVideo() {
    const oThis = this;

    const insertColumns = ['channel_id', 'video_id', 'status', 'created_at', 'updated_at'];

    logger.debug('---------oThis.insertChannelIdVideoIdMap-------', oThis.insertChannelIdVideoIdMap);
    for (let channelId in oThis.insertChannelIdVideoIdMap) {
      let videoIds = oThis.insertChannelIdVideoIdMap[channelId],
        insertValues = [];

      for (let i = 0; i < videoIds.length; i++) {
        let videoId = videoIds[i],
          videoTagKey = util.getVideoIdAndTagIdMapKey(videoId, 0);

        let createdAt = oThis.videoIdTagIdToVideoDetailsMap[videoTagKey]
          ? oThis.videoIdTagIdToVideoDetailsMap[videoTagKey].createdAt
          : basicHelper.getCurrentTimestampInSeconds();

        insertValues.push([
          channelId,
          videoId,
          channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus],
          createdAt,
          createdAt
        ]);
      }

      let insertionResult = await new ChannelVideoModel()
        .insertMultiple(insertColumns, insertValues, { touch: false, withIgnore: true })
        .fire();

      oThis.newVideosInChannel[channelId] = oThis.newVideosInChannel[channelId] || 0;
      oThis.newVideosInChannel[channelId] = oThis.newVideosInChannel[channelId] + insertionResult.affectedRows;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Mark channel videos active
   *
   * @Sets oThis.newVideosInChannel
   * @returns {Promise<*|result>}
   * @private
   */
  async _markChannelVideosActive() {
    const oThis = this;

    logger.debug('---------oThis.markActiveChannelIdVideoIdMap-------', oThis.markActiveChannelIdVideoIdMap);
    for (let channelId in oThis.markActiveChannelIdVideoIdMap) {
      let videoIds = oThis.markActiveChannelIdVideoIdMap[channelId];

      let updateResult = await new ChannelVideoModel()
        .update({
          pinned_at: null,
          status: channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus]
        })
        .where([
          'channel_id = ? AND video_id in (?) AND status=?',
          channelId,
          videoIds,
          channelVideosConstants.invertedStatuses[channelVideosConstants.inactiveStatus]
        ])
        .fire();

      oThis.newVideosInChannel[channelId] = oThis.newVideosInChannel[channelId] || 0;
      oThis.newVideosInChannel[channelId] = oThis.newVideosInChannel[channelId] + updateResult.affectedRows;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Update channel stats.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateChannelStats() {
    const oThis = this;

    const promisesArray = [];
    const cacheFlushChannelIds = [];

    for (const channelId in oThis.newVideosInChannel) {
      const videosCountToBeIncremented = oThis.newVideosInChannel[channelId];
      if (videosCountToBeIncremented === 0) {
        continue;
      }

      promisesArray.push(
        new ChannelStatModel()
          .update(['total_videos = total_videos + (?)', videosCountToBeIncremented])
          .where({ channel_id: channelId })
          .fire()
      );

      cacheFlushChannelIds.push(channelId);
    }

    await Promise.all(promisesArray);
    if (cacheFlushChannelIds.length === 0) {
      await ChannelStatModel.flushCache({ channelIds: cacheFlushChannelIds });
    }
  }

  /**
   * Clear channel tag video cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _clearChannelTagVideoCache(channelTagIdsMap) {
    const oThis = this;

    const promisesArray = [];

    for (let channelId in channelTagIdsMap) {
      let channelVideoTags = [...new Set(channelTagIdsMap[channelId])];

      for (let i = 0; i < channelVideoTags.length; i++) {
        let tagId = channelVideoTags[i];
        promisesArray.push(ChannelTagVideoModel.flushCache({ channelId: channelId, tagId: tagId }));
      }
    }

    return Promise.all(promisesArray);
  }

  /**
   * Clear channel video cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _clearChannelVideoCache() {
    const oThis = this;

    const promisesArray = [];

    for (const channelId in oThis.channelIdToVideoTagsMap) {
      promisesArray.push(ChannelVideoModel.flushCache({ channelId: channelId }));
    }

    await Promise.all(promisesArray);
  }

  async _clearVideoDetailsCache() {
    const oThis = this;

    //TODO: clear chache here.
  }

  /**
   * Get key for channelId and videoId map.
   *
   * @param {number} channelId
   * @param {number} videoId
   *
   * @returns {string}
   * @private
   */
  _getChannelIdAndVideoIdMapKey(channelId, videoId) {
    return `${channelId}_${videoId}`;
  }
}

module.exports = AddChannelTagVideo;
