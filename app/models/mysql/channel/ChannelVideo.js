const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos');

// Declare variables names.
const dbName = databaseConstants.channelDbName;

/**
 * Class for channel video model.
 *
 * @class ChannelVideoModel
 */
class ChannelVideoModel extends ModelBase {
  /**
   * Constructor for channels model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'channel_videos';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.channel_id
   * @param {number} dbRow.video_id
   * @param {number} dbRow.status
   * @param {number} dbRow.pinned_at
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @returns {{}}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      channelId: dbRow.channel_id,
      videoId: dbRow.video_id,
      status: channelVideosConstants.statuses[dbRow.status],
      pinnedAt: dbRow.pinned_at,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch video ids by channel id.
   *
   * @param {object} params
   * @param {number} params.limit
   * @param {number} params.channelId
   * @param {number} [params.paginationTimestamp]
   *
   * @returns {Promise<{}>}
   */
  async fetchVideoIdsByChannelId(params) {
    const oThis = this;

    const limit = params.limit,
      channelId = params.channelId,
      paginationTimestamp = params.paginationTimestamp;

    const queryObject = oThis
      .select('*')
      .where({
        channel_id: channelId,
        status: channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus]
      })
      .order_by('pinned_at desc, created_at desc')
      .limit(limit);

    if (paginationTimestamp) {
      queryObject.where(['created_at < ?', paginationTimestamp]);
    }

    const dbRows = await queryObject.fire();

    const videoIds = [];
    const channelVideoDetails = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      channelVideoDetails[formatDbRow.videoId] = formatDbRow;
      videoIds.push(formatDbRow.videoId);
    }

    return { videoIds: videoIds, channelVideoDetails: channelVideoDetails };
  }

  async fetchPopularChannelIdsByVideoIds(params) {
    const oThis = this,
      videoIds = params.videoIds,
      videoIdChannelIdsMap = {},
      allChannelIds = [];

    if (videoIds.length == 0) {
      return {};
    }
    const videoChannelResult = await oThis
      .select('*')
      .where({
        videoIds: videoIds,
        status: channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus]
      })
      .fire();

    for (let i = 0; i < videoChannelResult.length; i++) {
      let videoChannel = videoChannelResult[i];
      videoIdChannelIdsMap[videoChannel.video_id] = videoIdChannelIdsMap[videoChannel.video_id] || {};
      videoIdChannelIdsMap[videoChannel.video_id][videoChannel.channel_id] = 1;
      allChannelIds.push(videoChannel.channel_id);
    }

    let orderedAllChannelIds = await new ChannelStatModel().orderByPopularChannelIds(allChannelIds);

    for (let vId in videoIdChannelIdsMap) {
      let unorderedVChannelIds = videoIdChannelIdsMap[vId],
        orderedVChannelIds = [];

      for (let i = 0; i < orderedAllChannelIds.length; i++) {
        let vcId = orderedAllChannelIds[i];
        if (unorderedVChannelIds[vcId]) {
          orderedVChannelIds.push(vcId);
        }
      }

      videoIdChannelIdsMap[vId] = orderedVChannelIds;
    }

    return videoIdChannelIdsMap;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} [params.channelId]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    if (params.channelId) {
      const ChannelVideoIdsByChannelIdPaginationCache = require(rootPrefix +
        '/lib/cacheManagement/single/ChannelVideoIdsByChannelIdPagination');
      await new ChannelVideoIdsByChannelIdPaginationCache({ channelId: params.channelId }).clear();
    }
  }
}

module.exports = ChannelVideoModel;
