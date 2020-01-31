const rootPrefix = '../..',
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  ChannelTagVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTagVideo'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  util = require(rootPrefix + '/lib/util'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos');

/**
 * Class to add channel tag videos.
 *
 * @class AddChannelTagVideo
 */
class AddChannelTagVideo {
  /**
   * Constructor to add channel tag videos.
   *
   * @param {object} params
   * @param {object} params.channelIdToVideoTagsMap {c1: {v1: [t1,t2]}, c2: {v1: [t2,t3], v2: [t2,t4]}}
   * @param {object} params.videoIdTagIdToVideoDetailsMap {c1_t1: {createdAt: '', creatorUserId: ''}, c1_0: {createdAt: '', creatorUserId: ''}}
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
    oThis.markActiveChannelIds = [];
    oThis.insertChannelIds = [];

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

    await Promise.all([oThis._insertInChannelVideo(), oThis._markChannelVideosActive()]);

    await Promise.all([oThis._updateChannelStats(), oThis._clearChannelVideoCache(), oThis._clearVideoDetailsCache()]);

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
      const videoIdToTagIdsMap = oThis.channelIdToVideoTagsMap[channelId];
      for (const videoId in videoIdToTagIdsMap) {
        const tagIdsArray = videoIdToTagIdsMap[videoId];

        // TagIds can be empty.
        if (tagIdsArray.length === 0) {
          continue;
        }

        oThis.videoIds.push(videoId);
      }
    }

    // Remove duplicate videoIds.
    oThis.videoIds = basicHelper.uniquate(oThis.videoIds);
  }

  /**
   * Fetch active channel videos.
   *
   * @sets oThis.activeChannelVideos, oThis.inActiveChannelVideos
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchChannelVideos() {
    const oThis = this;

    if (oThis.channelIds.length === 0 || oThis.videoIds.length === 0) {
      return Promise.reject(new Error('Invalid input parameters.'));
    }

    const dbRows = await new ChannelVideoModel()
      .select('*')
      .where({
        channel_id: oThis.channelIds,
        video_id: oThis.videoIds
      })
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const dbRow = dbRows[index];

      const channelVideoKey = oThis._getChannelIdAndVideoIdMapKey(dbRow.channel_id, dbRow.video_id);
      if (+dbRow.status === +channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus]) {
        oThis.activeChannelVideos[channelVideoKey] = { pinnedAt: dbRow.pinned_at };
      } else {
        oThis.inActiveChannelVideos[channelVideoKey] = {};
      }
    }
  }

  /**
   * Multi insert in  channel tag video.
   *
   * @sets oThis.markActiveChannelIdVideoIdMap, oThis.insertChannelIdVideoIdMap
   * @sets oThis.markActiveChannelIds, oThis.insertChannelIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInChannelTagVideo() {
    const oThis = this;

    const insertColumns = ['channel_id', 'tag_id', 'video_id', 'pinned_at', 'created_at', 'updated_at'],
      insertValues = [],
      channelTagIdsMap = {};

    for (const channelId in oThis.channelIdToVideoTagsMap) {
      const videoIdToTagIdsArray = oThis.channelIdToVideoTagsMap[channelId];
      for (const videoId in videoIdToTagIdsArray) {
        const channelVideoTags = videoIdToTagIdsArray[videoId],
          channelVideoKey = oThis._getChannelIdAndVideoIdMapKey(channelId, videoId),
          channelVideo = oThis.activeChannelVideos[channelVideoKey],
          pinnedAt = channelVideo && channelVideo.pinnedAt ? channelVideo.pinnedAt : 0;

        if (!channelVideoTags || channelVideoTags.length <= 0) {
          continue;
        }

        if (oThis.inActiveChannelVideos[channelVideoKey]) {
          oThis.markActiveChannelIdVideoIdMap[channelId] = oThis.markActiveChannelIdVideoIdMap[channelId] || [];
          oThis.markActiveChannelIdVideoIdMap[channelId].push(videoId);
          oThis.markActiveChannelIds.push(channelId);
        } else if (!oThis.activeChannelVideos[channelVideoKey]) {
          oThis.insertChannelIdVideoIdMap[channelId] = oThis.insertChannelIdVideoIdMap[channelId] || [];
          oThis.insertChannelIdVideoIdMap[channelId].push(videoId);
          oThis.insertChannelIds.push(channelId);
        }
        channelTagIdsMap[channelId] = channelTagIdsMap[channelId] || [];
        channelTagIdsMap[channelId] = channelTagIdsMap[channelId].concat(channelVideoTags);

        for (let index = 0; index < channelVideoTags.length; index++) {
          const tagId = channelVideoTags[index],
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
  }

  /**
   * Insert in channel videos table.
   *
   * @sets oThis.newVideosInChannel
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _insertInChannelVideo() {
    const oThis = this;

    const insertColumns = ['channel_id', 'video_id', 'status', 'created_at', 'updated_at'];

    const promisesArray = [];

    for (let index = 0; index < oThis.insertChannelIds.length; index++) {
      const channelId = oThis.insertChannelIds[index];
      const videoIds = oThis.insertChannelIdVideoIdMap[channelId];
      const insertValues = [];

      for (let ind = 0; ind < videoIds.length; ind++) {
        const videoId = videoIds[ind],
          videoTagKey = util.getVideoIdAndTagIdMapKey(videoId, 0);

        const createdAt = oThis.videoIdTagIdToVideoDetailsMap[videoTagKey]
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

      promisesArray.push(
        new ChannelVideoModel().insertMultiple(insertColumns, insertValues, { touch: false, withIgnore: true }).fire()
      );
    }

    const promisesResponse = await Promise.all(promisesArray);

    for (let index = 0; index < oThis.insertChannelIds.length; index++) {
      const channelId = oThis.insertChannelIds[index];
      const insertionResult = promisesResponse[index];

      oThis.newVideosInChannel[channelId] = oThis.newVideosInChannel[channelId] || 0;
      oThis.newVideosInChannel[channelId] += insertionResult.affectedRows;
    }
  }

  /**
   * Mark channel videos active.
   *
   * @sets oThis.newVideosInChannel
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _markChannelVideosActive() {
    const oThis = this;

    const promisesArray = [];

    for (let index = 0; index < oThis.markActiveChannelIds.length; index++) {
      const channelId = oThis.markActiveChannelIds[index];
      const videoIds = oThis.markActiveChannelIdVideoIdMap[channelId];

      promisesArray.push(
        new ChannelVideoModel()
          .update({
            pinned_at: null,
            status: channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus]
          })
          .where([
            'channel_id = ? AND video_id IN (?) AND status = ?',
            channelId,
            videoIds,
            channelVideosConstants.invertedStatuses[channelVideosConstants.inactiveStatus]
          ])
          .fire()
      );
    }

    const promisesResponse = await Promise.all(promisesArray);

    for (let index = 0; index < oThis.markActiveChannelIds.length; index++) {
      const channelId = oThis.markActiveChannelIds[index];

      const updateResult = promisesResponse[index];
      oThis.newVideosInChannel[channelId] = oThis.newVideosInChannel[channelId] || 0;
      oThis.newVideosInChannel[channelId] += updateResult.affectedRows;
    }
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
    if (cacheFlushChannelIds.length !== 0) {
      await ChannelStatModel.flushCache({ channelIds: cacheFlushChannelIds });
    }
  }

  /**
   * Clear channel tag video cache.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _clearChannelTagVideoCache(channelTagIdsMap) {
    const promisesArray = [];

    for (const channelId in channelTagIdsMap) {
      const channelVideoTags = basicHelper.uniquate(channelTagIdsMap[channelId]);

      for (let index = 0; index < channelVideoTags.length; index++) {
        const tagId = channelVideoTags[index];
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

  /**
   * Clear video details cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _clearVideoDetailsCache() {
    const oThis = this;

    const userIds = [];

    for (const videoIdTagIdKey in oThis.videoIdTagIdToVideoDetailsMap) {
      const creatorUserId = oThis.videoIdTagIdToVideoDetailsMap[videoIdTagIdKey].creatorUserId;
      if (creatorUserId) {
        userIds.push(creatorUserId);
      }
    }

    const promisesArray = [];

    for (let index = 0; index < userIds.length; index++) {
      promisesArray.push(VideoDetailModel.flushCache({ userId: userIds[index] }));
    }

    promisesArray.push(VideoDetailModel.flushCache({ videoIds: oThis.videoIds }));

    await Promise.all(promisesArray);
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
