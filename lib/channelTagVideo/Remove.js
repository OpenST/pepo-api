const rootPrefix = '../..',
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  ChannelTagVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTagVideo'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos');

/*
TODO: channels - We can query channel_videos for active channelIds and videoIds combinations. This would help us prevent
multiple update queries in the third step. We are not doing that for now as we assume that the delegator sends us
correct data. If multiple update queries are still being made, we can revisit this assumption.
 */

/*
STEPS:
1. Delete all entries from channel_tag_videos.
2. Query channel_tag_videos based on channelIds and videoIds.
3. If entry found in the previous query matches the activeStatus records from the first query, ignore them. If not found,
   mark those channelId and videoId entries as inactive in channel_videos table.
4. Update channel_stats table according to the results from query 3.
 */

/**
 * Class to remove channel tag videos.
 *
 * @class RemoveChannelTagVideo
 */
class RemoveChannelTagVideo {
  /**
   * Constructor to remove channel tag videos.
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
    oThis.channelIdToTagIdsMap = {};
    oThis.videoIds = [];
    oThis.toBeUpdatedChannelVideosMap = {};
    oThis.deleteRequestsObjectsArray = [];

    oThis.activeChannelTagVideos = {};

    oThis.channelIdsToBeAffected = [];
    oThis.channelIdToVideoIdsMapToUpdate = {};
    oThis.channelIdToVideoDecrementCount = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    logger.debug('==oThis.channelIdToVideoTagsMap====', oThis.channelIdToVideoTagsMap);

    oThis._createPrerequisiteData();

    if (oThis.channelIds.length === 0 || oThis.videoIds.length === 0) {
      logger.error('Invalid input object.');
      logger.error(`channelIdToVideoTagsMap: ${oThis.channelIdToVideoTagsMap}`);
      logger.error(`channelIds: ${oThis.channelIds}`);
      logger.error(`videoIds: ${oThis.videoIds}`);

      return;
    }

    await oThis._deleteFromChannelTagVideos(); // Step 1.

    await oThis._fetchChannelTagVideos(); // Step 2.

    oThis._getChannelVideosToMarkInactive(); // Intermediate step.

    await oThis._markChannelVideosInactive(); // Step 3.

    await Promise.all([oThis._updateChannelStats(), oThis._clearVideoDetailsCache()]); // Step 4.
  }

  /**
   * Create prerequisite data.
   *
   * @sets oThis.channelIds, oThis.channelIdToTagIdsMap, oThis.videoIds
   * @sets oThis.toBeUpdatedChannelVideosMap, oThis.deleteRequestsObjectsArray
   *
   * @private
   */
  _createPrerequisiteData() {
    const oThis = this;

    for (const channelId in oThis.channelIdToVideoTagsMap) {
      oThis.channelIds.push(channelId);
      oThis.channelIdToTagIdsMap[channelId] = [];

      const videoIdToTagIdsArray = oThis.channelIdToVideoTagsMap[channelId];
      for (const videoId in videoIdToTagIdsArray) {
        const tagIdsArray = videoIdToTagIdsArray[videoId];

        // TagIds can be empty.
        if (tagIdsArray.length === 0) {
          continue;
        }

        oThis.videoIds.push(videoId);
        const channelVideoKey = oThis._getChannelIdAndVideoIdMapKey(channelId, videoId);
        oThis.toBeUpdatedChannelVideosMap[channelVideoKey] = 1;

        const deleteRequestObject = {
          channel_id: channelId,
          video_id: videoId,
          tag_id: tagIdsArray
        };
        oThis.deleteRequestsObjectsArray.push(deleteRequestObject);
        oThis.channelIdToTagIdsMap[channelId] = oThis.channelIdToTagIdsMap[channelId].concat(tagIdsArray);
      }

      oThis.channelIdToTagIdsMap[channelId] = [...new Set(oThis.channelIdToTagIdsMap[channelId])];
    }

    // Remove duplicate videoIds.
    oThis.videoIds = [...new Set(oThis.videoIds)];
  }

  /**
   * Delete entries from channel tag videos table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteFromChannelTagVideos() {
    const oThis = this;

    const promisesArray = [];

    for (let index = 0; index < oThis.deleteRequestsObjectsArray.length; index++) {
      promisesArray.push(
        new ChannelTagVideoModel()
          .delete()
          .where(oThis.deleteRequestsObjectsArray[index])
          .fire()
      );
    }

    await Promise.all(promisesArray);
    await oThis._clearChannelTagVideoCache();
  }

  /**
   * Clear channel tag video cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _clearChannelTagVideoCache() {
    const oThis = this;

    const promisesArray = [];

    for (const channelId in oThis.channelIdToTagIdsMap) {
      const tagIds = oThis.channelIdToTagIdsMap[channelId];

      for (let index = 0; index < tagIds.length; index++) {
        promisesArray.push(ChannelTagVideoModel.flushCache({ channelId: channelId, tagId: tagIds[index] }));
      }
    }

    await Promise.all(promisesArray);
  }

  /**
   * Fetch channel tag videos left after delete query.
   *
   * @sets oThis.activeChannelTagVideos
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchChannelTagVideos() {
    const oThis = this;

    const dbRows = await new ChannelTagVideoModel()
      .select('channel_id, video_id')
      .where({ channel_id: oThis.channelIds, video_id: oThis.videoIds })
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const dbRow = dbRows[index];

      const channelVideoKey = oThis._getChannelIdAndVideoIdMapKey(dbRow.channel_id, dbRow.video_id);
      oThis.activeChannelTagVideos[channelVideoKey] = 1;
    }
  }

  /**
   * Get channelId and videoIds combination which needs to be marked as inactive in channel_videos table.
   *
   * @sets oThis.channelIdToVideoIdsMapToUpdate
   *
   * @private
   */
  _getChannelVideosToMarkInactive() {
    const oThis = this;

    /*
    Loop over activeChannel videos. If the key found in toBeUpdatedChannelVideosMap does not exist in
    activeChannelTagVideosMap, that means the channelId and videoId combination needs to be marked as
    inactive in channel_videos table.
     */
    for (const activeChannelIdAndVideoIdKey in oThis.toBeUpdatedChannelVideosMap) {
      if (!Object.prototype.hasOwnProperty.call(oThis.activeChannelTagVideos, activeChannelIdAndVideoIdKey)) {
        const { channelId, videoId } = oThis._splitChannelIdAndVideoIdKey(activeChannelIdAndVideoIdKey);
        oThis.channelIdToVideoIdsMapToUpdate[channelId] = oThis.channelIdToVideoIdsMapToUpdate[channelId] || [];
        oThis.channelIdToVideoIdsMapToUpdate[channelId].push(videoId);
        oThis.channelIdsToBeAffected.push(channelId);
      }
    }
  }

  /**
   * Mark channel videos inactive.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markChannelVideosInactive() {
    const oThis = this;

    const promisesArray = [];

    for (let index = 0; index < oThis.channelIdsToBeAffected.length; index++) {
      const channelId = oThis.channelIdsToBeAffected[index];
      const videoIds = oThis.channelIdToVideoIdsMapToUpdate[channelId];
      promisesArray.push(
        new ChannelVideoModel()
          .update({
            pinned_at: null,
            status: channelVideosConstants.invertedStatuses[channelVideosConstants.inactiveStatus]
          })
          .where({
            channel_id: channelId,
            video_id: videoIds,
            status: channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus]
          })
          .fire()
      );
    }

    const promisesResponse = await Promise.all(promisesArray);

    for (let index = 0; index < oThis.channelIdsToBeAffected.length; index++) {
      const channelId = oThis.channelIdsToBeAffected[index];
      const updateResponse = promisesResponse[index];
      oThis.channelIdToVideoDecrementCount[channelId] = updateResponse.affectedRows;
    }

    await oThis._clearChannelVideoCache();
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

    for (let index = 0; index < oThis.channelIdsToBeAffected.length; index++) {
      promisesArray.push(ChannelVideoModel.flushCache({ channelId: oThis.channelIdsToBeAffected[index] }));
    }

    await Promise.all(promisesArray);
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

    for (const channelId in oThis.channelIdToVideoDecrementCount) {
      const videosCountToBeDecremented = oThis.channelIdToVideoDecrementCount[channelId];
      if (videosCountToBeDecremented === 0) {
        continue;
      }

      promisesArray.push(
        new ChannelStatModel()
          .update(['total_videos = total_videos - ?', videosCountToBeDecremented])
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

  /**
   * Split channelId and videoId merged key.
   *
   * @param {string} key
   *
   * @returns {{videoId: *, channelId: *}}
   * @private
   */
  _splitChannelIdAndVideoIdKey(key) {
    const splitArray = key.split('_');

    return { channelId: splitArray[0], videoId: splitArray[1] };
  }
}

module.exports = RemoveChannelTagVideo;
