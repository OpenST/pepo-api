const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables names.
const dbName = databaseConstants.channelDbName;

/**
 * Class for channel stats model.
 *
 * @class ChannelStatModel
 */
class ChannelStatModel extends ModelBase {
  /**
   * Constructor for channel stats model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'channel_stats';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.channel_id
   * @param {number} dbRow.total_videos
   * @param {number} dbRow.total_users
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
      totalVideos: dbRow.total_videos ? dbRow.total_videos : 0,
      totalUsers: dbRow.total_users ? dbRow.total_users : 0,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Get channel stats by channel ids.
   *
   * @param {array<number>} channelIds
   *
   * @returns {Promise<any>}
   */
  async getByChannelIds(channelIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ channel_id: channelIds })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.channelId] = formatDbRow;
    }

    return response;
  }

  /**
   * Get channel stats by channel ids.
   *
   * @param {array<number>} channelIds
   *
   * @returns {Promise<any>}
   */
  async orderByPopularChannelIds(channelIds) {
    const oThis = this,
      orderedChannelIds = [];

    const dbRows = await oThis
      .select('channel_id, total_users')
      .where({ channel_id: channelIds })
      .order('total_users DESC')
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      orderedChannelIds.push(dbRows[index].channel_id);
    }

    return orderedChannelIds;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {array<number>} [params.channelIds]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.channelIds) {
      const ChannelStatByChannelIdsCache = require(rootPrefix +
        '/lib/cacheManagement/multi/channel/ChannelStatByChannelIds');
      promisesArray.push(new ChannelStatByChannelIdsCache({ channelIds: params.channelIds }).clear());
    }

    if (params.channelId) {
      const ChannelStatByChannelIdsCache = require(rootPrefix +
        '/lib/cacheManagement/multi/channel/ChannelStatByChannelIds');
      promisesArray.push(new ChannelStatByChannelIdsCache({ channelIds: [params.channelId] }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = ChannelStatModel;
