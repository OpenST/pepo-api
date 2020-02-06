const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  channelTagsConstants = require(rootPrefix + '/lib/globalConstant/channel/channelTags');

// Declare variables names.
const dbName = databaseConstants.channelDbName;

/**
 * Class for channel tags model.
 *
 * @class ChannelTagModel
 */
class ChannelTagModel extends ModelBase {
  /**
   * Constructor for channel tags model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'channel_tags';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.channel_id
   * @param {number} dbRow.tag_id
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
      tagId: dbRow.tag_id,
      status: channelTagsConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch active tag ids by channel ids.
   *
   * @param {array<number>} channelIds
   *
   * @returns {Promise<void>}
   */
  async fetchActiveChannelsTagsByChannelIds(channelIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('channel_id, tag_id')
      .where({
        channel_id: channelIds,
        status: channelTagsConstants.invertedStatuses[channelTagsConstants.activeStatus] // TODO:channels - verify index.
      })
      .order_by('created_at desc')
      .fire();

    const response = {};

    for (let index = 0; index < channelIds.length; index++) {
      response[channelIds[index]] = [];
    }

    for (let index = 0; index < dbRows.length; index++) {
      response[dbRows[index].channel_id].push(dbRows[index].tag_id);
    }

    return response;
  }

  /**
   * Fetch active channel ids by tag ids.
   *
   * @param tagIds
   * @returns {Promise<void>}
   */
  async fetchActiveChannelsByTagIds(tagIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('channel_id, tag_id')
      .where({
        tag_id: tagIds,
        status: channelTagsConstants.invertedStatuses[channelTagsConstants.activeStatus]
      })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formattedDbRow = oThis.formatDbData(dbRows[index]);
      response[formattedDbRow.channelId] = response[formattedDbRow.channelId] || [];
      response[formattedDbRow.channelId].push(formattedDbRow.tagId);
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {array<number>} params.channelIds
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.channelIds) {
      const ChannelTagByChannelIdsCache = require(rootPrefix +
        '/lib/cacheManagement/multi/channel/ChannelTagByChannelIds');
      promisesArray.push(new ChannelTagByChannelIdsCache({ channelIds: params.channelIds }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = ChannelTagModel;
