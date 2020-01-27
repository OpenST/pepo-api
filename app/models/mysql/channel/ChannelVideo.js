const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
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
      status: channelVideosConstants.invertedStatuses[dbRow.status],
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
      .order_by('created_at desc')
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
      const VideoIdsByChannelIdPaginationCache = require(rootPrefix +
        '/lib/cacheManagement/single/VideoIdsByChannelIdPagination');
      await new VideoIdsByChannelIdPaginationCache({ channelId: params.channelId }).clear();
    }
  }
}

module.exports = ChannelVideoModel;
