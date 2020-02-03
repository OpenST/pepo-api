const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables names.
const dbName = databaseConstants.channelDbName;

/**
 * Class for channel tag video model.
 *
 * @class ChannelTagVideoModel
 */
class ChannelTagVideoModel extends ModelBase {
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

    oThis.tableName = 'channel_tag_videos';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.channel_id
   * @param {number} dbRow.tag_id
   * @param {number} dbRow.video_id
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
      tagId: dbRow.tag_id,
      videoId: dbRow.video_id,
      pinnedAt: dbRow.pinned_at,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch video ids by channel id and tag id.
   *
   * @param {object} params
   * @param {number} params.limit
   * @param {number} params.tagId
   * @param {number} params.channelId
   * @param {number} [params.page]
   *
   * @returns {Promise<{channelTagVideoDetails: *, videoIds: *}>}
   */
  async fetchVideoIdsByChannelIdAndTagId(params) {
    const oThis = this;

    const page = params.page,
      limit = params.limit,
      offset = (page - 1) * limit;

    const dbRows = await oThis
      .select('*')
      .where({
        channel_id: params.channelId,
        tag_id: params.tagId
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
   * Flush cache.
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.channelId && params.tagId) {
      const ChannelTagVideoIdsByTagIdAndChannelIdPaginationCache = require(rootPrefix +
        '/lib/cacheManagement/single/ChannelTagVideoIdsByTagIdAndChannelIdPagination');
      promisesArray.push(
        new ChannelTagVideoIdsByTagIdAndChannelIdPaginationCache({
          channelId: params.channelId,
          tagId: params.tagId
        }).clear()
      );
    }

    await Promise.all(promisesArray);
  }
}

module.exports = ChannelTagVideoModel;
