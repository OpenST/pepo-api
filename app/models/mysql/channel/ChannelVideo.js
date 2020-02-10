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
   * @param {number} [params.page]
   *
   * @returns {Promise<{}>}
   */
  async fetchVideoIdsByChannelId(params) {
    const oThis = this;

    const page = params.page,
      limit = params.limit,
      offset = (page - 1) * limit;

    const dbRows = await oThis
      .select('*')
      .where({
        channel_id: params.channelId,
        status: channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus]
      })
      .order_by('pinned_at desc, created_at desc')
      .limit(limit)
      .offset(offset)
      .fire();

    const videoIds = [];
    const channelVideoDetails = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      channelVideoDetails[formatDbRow.videoId] = formatDbRow;
      videoIds.push(formatDbRow.videoId);
    }

    return { videoIds: videoIds, channelVideoDetails: channelVideoDetails };
  }

  /**
   * Fetch popular channel ids by video ids.
   *
   * @param {object} params
   * @param {array<number>} params.videoIds
   *
   * @returns {Promise<{}>}
   */
  async fetchPopularChannelIdsByVideoIds(params) {
    const oThis = this;

    const videoIds = params.videoIds,
      videoIdChannelIdsMap = {},
      allChannelIds = [];

    if (videoIds.length === 0) {
      return {};
    }
    const videoChannelResult = await oThis
      .select('*')
      .where({
        video_id: videoIds,
        status: channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus]
      })
      .fire();

    for (let index = 0; index < videoChannelResult.length; index++) {
      const videoChannel = videoChannelResult[index];
      videoIdChannelIdsMap[videoChannel.video_id] = videoIdChannelIdsMap[videoChannel.video_id] || {};
      videoIdChannelIdsMap[videoChannel.video_id][videoChannel.channel_id] = 1;
      allChannelIds.push(videoChannel.channel_id);
    }

    const orderedAllChannelIds = await new ChannelStatModel().orderByPopularChannelIds(allChannelIds);

    for (const videoId in videoIdChannelIdsMap) {
      const unorderedVChannelIds = videoIdChannelIdsMap[videoId],
        orderedVChannelIds = [];

      for (let index = 0; index < orderedAllChannelIds.length; index++) {
        const vcId = orderedAllChannelIds[index];
        if (unorderedVChannelIds[vcId]) {
          orderedVChannelIds.push(vcId);
        }
      }

      videoIdChannelIdsMap[videoId] = orderedVChannelIds;
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
