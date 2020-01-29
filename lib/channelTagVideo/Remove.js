const rootPrefix = '../..',
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
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
    oThis.videoIds = [];

    oThis.allChannelVideos = {};
    oThis.activeChannelVideos = {};
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

    oThis._createChannelIdsAndVideoIdsArray();

    await oThis._fetchActiveChannelVideos();
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
        const channelVideoKey = oThis._getChannelIdAndVideoIdMapKey(channelId, videoId);
        oThis.allChannelVideos[channelVideoKey] = 1;
        oThis.videoIds.push(videoId);
      }
    }

    oThis.videoIds = [...new Set(oThis.videoIds)];

    logger.debug('==oThis.channelIds====', oThis.channelIds);
    logger.debug('==oThis.videoIds====', oThis.videoIds);
    logger.debug('==oThis.allChannelVideos====', oThis.allChannelVideos);
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

    logger.debug('==dbRows====', dbRows);
    logger.debug('==oThis.activeChannelVideos====', oThis.activeChannelVideos);
  }

  async _deleteFromChannelTagVideos() {
    const oThis = this;
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
    return `c${channelId}_v${videoId}`;
  }
}

module.exports = RemoveChannelTagVideo;
