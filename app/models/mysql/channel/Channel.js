const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

// Declare variables names.
const dbName = databaseConstants.channelDbName;

/**
 * Class for channels model.
 *
 * @class ChannelModel
 */
class ChannelModel extends ModelBase {
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

    oThis.tableName = 'channels';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {String} dbRow.name
   * @param {number} dbRow.status
   * @param {number} dbRow.tagline_id
   * @param {number} dbRow.description_id
   * @param {number} dbRow.cover_image_id
   * @param {String} dbRow.permalink
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @returns {{}}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      name: dbRow.name,
      status: channelConstants.statuses[dbRow.status],
      descriptionId: dbRow.description_id,
      taglineId: dbRow.tagline_id,
      coverImageId: dbRow.cover_image_id,
      permalink: dbRow.permalink,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch channel for given ids.
   *
   * @param {array} ids: channel ids
   *
   * @return {object}
   */
  async fetchByIds(ids) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where(['id IN (?)', ids])
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Fetch Channel ids from permalinks
   *
   * @param permalinks
   * @returns {Promise<void>}
   */
  async fetchIdsByPermalinks(permalinks) {
    const oThis = this;

    const dbRows = await oThis
      .select('id, permalink')
      .where(['permalink IN (?)', permalinks])
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const dbRow = dbRows[index];
      response[dbRow.permalink.toLowerCase()] = dbRow.id;
    }

    return response;
  }

  /**
   * Get channels that starts with channel prefix.
   *
   * @param {object} params
   * @param {number} [params.paginationTimestamp]
   * @param {number} [params.limit]
   * @param {boolean} params.isAdminSearch
   * @param {string} params.channelPrefix
   *
   * @returns {Promise<{}>}
   */
  async getChannelsByPrefix(params) {
    const oThis = this;

    const query = params.channelPrefix,
      limit = params.limit || 10,
      isAdminSearch = params.isAdminSearch,
      paginationTimestamp = params.paginationTimestamp;

    const queryWithWildCards = query + '%',
      queryWithWildCardsSpaceIncluded = '% ' + query + '%';

    const queryObject = await oThis
      .select('*')
      .where(['name LIKE ? OR name LIKE ?', queryWithWildCards, queryWithWildCardsSpaceIncluded])
      .order_by('created_at DESC')
      .limit(limit);

    if (!isAdminSearch) {
      queryObject.where({ status: channelConstants.invertedStatuses[channelConstants.activeStatus] });
    }

    if (paginationTimestamp) {
      queryObject.where(['created_at < ?', paginationTimestamp]);
    }

    const dbRows = await queryObject.fire();

    const channelIds = [];

    for (let index = 0; index < dbRows.length; index++) {
      const channelId = dbRows[index].id;
      channelIds.push(channelId);
    }

    return { channelIds: channelIds };
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {array<number>} [params.ids]
   * @param {array<string>} [params.permalinks]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.ids) {
      const ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds');
      promisesArray.push(new ChannelByIdsCache({ ids: params.ids }).clear());
    }

    if (params.permalinks) {
      const ChannelByPermalinksCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByPermalinks');
      promisesArray.push(new ChannelByPermalinksCache({ permalinks: params.permalinks }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = ChannelModel;
