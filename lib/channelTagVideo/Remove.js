const rootPrefix = '../..',
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  ChannelTagVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTagVideo'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos');

/*
STEPS:
1. Segregate channel videos based on status. Query on channel_videos table. Ignore the already inactiveStatus entries.
2. Delete all entries from channel_tag_videos.
3. Query channel_tag_videos based on channelIds and videoIds.
4. If entry found in the previous query matches the activeStatus records from the first query, ignore them. If not found,
   mark those channelId and videoId entries as inactive in channel_videos table.
5. Update channel_stats table according to the results from query 4.

NOTE: Queries 1 and 2 can run simultaneously.
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
   * @param {object} params.channelIdToVideoTagsMap
   * @param {object} params.videoIdToVideoDetailsMap
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.channelIdToVideoTagsMap = params.channelIdToVideoTagsMap;
    oThis.videoIdToVideoDetailsMap = params.videoIdToVideoDetailsMap;

    oThis.channelIds = [];
    oThis.channelIdToTagIdsMap = {};
    oThis.videoIds = [];
    oThis.deleteRequestsObjectsArray = [];

    oThis.activeChannelVideos = {};

    oThis.activeChannelTagVideos = {};

    oThis.channelIdToVideoIdsMapToUpdate = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    logger.debug('==oThis.channelIdToVideoTagsMap====', oThis.channelIdToVideoTagsMap);
    logger.debug('==oThis.videoIdToVideoDetailsMap====', oThis.videoIdToVideoDetailsMap);

    oThis._createPrerequisiteData();

    const promisesArray = [oThis._fetchActiveChannelVideos(), oThis._deleteFromChannelTagVideos()];
    await Promise.all(promisesArray);

    await oThis._fetchChannelTagVideos();

    oThis._getChannelVideosToMarkInactive();

    await oThis._markChannelVideosInactive();

    await oThis._updateChannelStats();
  }

  /**
   * Create channelIds and videoIds array.
   *
   * @sets oThis.channelIds, oThis.channelIdToTagIdsMap
   * @sets oThis.deleteRequestsObjectsArray, oThis.videoIds
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
        oThis.videoIds.push(videoId);

        const deleteRequestObject = {
          channel_id: channelId,
          video_id: videoId,
          tag_id: videoIdToTagIdsArray[videoId]
        };
        oThis.deleteRequestsObjectsArray.push(deleteRequestObject);
        oThis.channelIdToTagIdsMap[channelId] = oThis.channelIdToTagIdsMap[channelId].concat(
          videoIdToTagIdsArray[videoId]
        );
      }

      oThis.channelIdToTagIdsMap[channelId] = [...new Set(oThis.channelIdToTagIdsMap[channelId])];
    }

    oThis.videoIds = [...new Set(oThis.videoIds)];

    logger.debug('==oThis.channelIds====', oThis.channelIds);
    logger.debug('==oThis.videoIds====', oThis.videoIds);
    logger.debug('==oThis.deleteRequestsObjectsArray====', oThis.deleteRequestsObjectsArray);
    logger.debug('==oThis.channelIdToTagIdsMap====', oThis.channelIdToTagIdsMap);
  }

  /**
   * Fetch active channel videos.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchActiveChannelVideos() {
    const oThis = this;

    if (oThis.channelIds.length === 0 || oThis.videoIds.length === 0) {
      return Promise.reject(new Error('Invalid input parameters.'));
    }

    const dbRows = await new ChannelVideoModel()
      .select('channel_id, video_id')
      .where({
        channel_id: oThis.channelIds,
        video_id: oThis.videoIds,
        status: channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus]
      })
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const dbRow = dbRows[index];

      const channelVideoKey = oThis._getChannelIdAndVideoIdMapKey(dbRow.channel_id, dbRow.video_id);
      oThis.activeChannelVideos[channelVideoKey] = 1;
    }

    logger.debug('==oThis.activeChannelVideos====', oThis.activeChannelVideos);
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

    logger.debug('==oThis.activeChannelTagVideos====', oThis.activeChannelTagVideos);
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
    Loop over activeChannel videos. If the key found in activeChannelVideos does not exist in
    activeChannelTagVideosMap, that means the channelId and videoId combination needs to be marked as
    inactive in channel_videos table.
     */
    for (const activeChannelIdAndVideoIdKey in oThis.activeChannelVideos) {
      if (!Object.prototype.hasOwnProperty.call(oThis.activeChannelTagVideos, activeChannelIdAndVideoIdKey)) {
        const { channelId, videoId } = oThis._splitChannelIdAndVideoIdKey(activeChannelIdAndVideoIdKey);
        oThis.channelIdToVideoIdsMapToUpdate[channelId] = oThis.channelIdToVideoIdsMapToUpdate[channelId] || [];
        oThis.channelIdToVideoIdsMapToUpdate[channelId].push(videoId);
      }
    }

    logger.debug('==oThis.channelIdToVideoIdsMapToUpdate====', oThis.channelIdToVideoIdsMapToUpdate);
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

    for (const channelId in oThis.channelIdToVideoIdsMapToUpdate) {
      const videoIds = oThis.channelIdToVideoIdsMapToUpdate[channelId];
      promisesArray.push(
        new ChannelVideoModel()
          .update({ status: channelVideosConstants.invertedStatuses[channelVideosConstants.inactiveStatus] })
          .where({
            channel_id: channelId,
            video_id: videoIds
          })
          .fire()
      );
    }

    await Promise.all(promisesArray);
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

    for (const channelId in oThis.channelIdToVideoIdsMapToUpdate) {
      promisesArray.push(ChannelVideoModel.flushCache({ channelId: channelId }));
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

    for (const channelId in oThis.channelIdToVideoIdsMapToUpdate) {
      const videosCountToBeDecremented = oThis.channelIdToVideoIdsMapToUpdate[channelId].length;
      if (videosCountToBeDecremented > 0) {
        promisesArray.push(
          new ChannelStatModel()
            .update(['total_videos = total_videos - (?)', videosCountToBeDecremented])
            .where({ channel_id: channelId })
            .fire()
        );

        cacheFlushChannelIds.push(channelId);
      }
    }

    await Promise.all(promisesArray);
    if (cacheFlushChannelIds.length === 0) {
      await ChannelStatModel.flushCache({ channelIds: cacheFlushChannelIds });
    }
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
