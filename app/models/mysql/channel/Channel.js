const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  MeetingModel = require(rootPrefix + '/app/models/mysql/meeting/Meeting'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
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
   * @param {number} dbRow.share_image_id
   * @param {number} dbRow.trending_rank
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
      shareImageId: dbRow.share_image_id,
      permalink: dbRow.permalink,
      trendingRank: dbRow.trending_rank,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch ids created recently.
   *
   * @return {object}
   */
  async fetchNewChannelIds() {
    const oThis = this;

    const channelIds = [],
      currentTime = basicHelper.getCurrentTimestampInSeconds();

    const response = await oThis
      .select('id')
      .where({ status: channelConstants.invertedStatuses[channelConstants.activeStatus] })
      .where(['created_at < ?', currentTime - channelConstants.newChannelIntervalInSec])
      .order_by('created_at desc')
      .fire();

    for (let i = 0; i < response.length; i++) {
      channelIds.push(response[i].id);
    }

    return { ids: channelIds };
  }

  /**
   * Fetch ids based on trendingRank value in descending order.
   *
   * @return {object}
   */
  async fetchByTrendingChannelIds() {
    const oThis = this;

    const channelIds = [];

    const response = await oThis
      .select('id')
      .order_by('trending_rank asc')
      .limit(channelConstants.trendingChannelsLimit)
      .fire();

    for (let i = 0; i < response.length; i++) {
      channelIds.push(response[i].id);
    }

    return { ids: channelIds };
  }

  /**
   * Fetch all channel ids.
   *
   * @return {object}
   */
  async fetchAllChannelIds() {
    const oThis = this;

    const channelIds = [];

    const response = await oThis
      .select('id')
      .where({ status: channelConstants.invertedStatuses[channelConstants.activeStatus] })
      .order_by('name asc')
      .fire();

    for (let i = 0; i < response.length; i++) {
      channelIds.push(response[i].id);
    }

    return { ids: channelIds };
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

    const promisesResponse = await Promise.all([
      new MeetingModel().fetchMeetingIdByChannelIds(ids),
      oThis
        .select('*')
        .where(['id IN (?)', ids])
        .fire()
    ]);

    const liveMeetingIdsData = promisesResponse[0];

    const dbRows = promisesResponse[1];

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const channelId = dbRows[index].id;
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
      response[formatDbRow.id].liveMeetingId = (liveMeetingIdsData[channelId] || {}).liveMeetingId;
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
      response[dbRow.permalink.toLowerCase()] = { id: dbRow.id };
    }

    return response;
  }

  /**
   * Get channels that starts with channel prefix.
   *
   * @param {object} params
   * @param {number} params.offset
   * @param {number} params.limit
   * @param {string} params.channelPrefix
   * @param {array} params.ids
   *
   * @returns {Promise<{}>}
   */
  async searchChannelsByPrefix(params) {
    const oThis = this;

    const queryWithWildCards = params.channelPrefix + '%',
      queryWithWildCardsSpaceIncluded = '% ' + params.channelPrefix + '%';

    const queryObject = await oThis
      .select('id')
      .where(['name LIKE ? OR name LIKE ?', queryWithWildCards, queryWithWildCardsSpaceIncluded])
      .where({ id: params.ids })
      .where({ status: channelConstants.invertedStatuses[channelConstants.activeStatus] })
      .order_by(['ID', params.ids], { useField: true })
      .offset(params.offset)
      .limit(params.limit);

    const dbRows = await queryObject.fire();

    const channelIds = [];

    for (let index = 0; index < dbRows.length; index++) {
      const channelId = dbRows[index].id;
      channelIds.push(channelId);
    }

    return { channelIds: channelIds };
  }

  /**
   * Get channels that starts with channel prefix.
   *
   * @param {object} params
   * @param {number} params.offset
   * @param {number} params.limit
   * @param {string} params.channelPrefix
   *
   * @returns {Promise<{}>}
   */
  async searchAllChannelsByPrefix(params) {
    console.log(params);

    console.log(params.offset);
    console.log(typeof params.offset);
    const oThis = this;

    const queryWithWildCards = params.channelPrefix + '%',
      queryWithWildCardsSpaceIncluded = '% ' + params.channelPrefix + '%';

    const dbRows = await (await oThis
      .select('id')
      .where(['name LIKE ? OR name LIKE ?', queryWithWildCards, queryWithWildCardsSpaceIncluded])
      .where({ status: channelConstants.invertedStatuses[channelConstants.activeStatus] })
      .order_by('name asc')
      .offset(params.offset)
      .limit(params.limit)).fire();

    const channelIds = [];

    for (let index = 0; index < dbRows.length; index++) {
      const channelId = dbRows[index].id;
      channelIds.push(channelId);
    }

    return { channelIds: channelIds };
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
   * Get username unique index name.
   *
   * @returns {string}
   */
  static get nameUniqueIndexName() {
    return 'uidx_1';
  }

  /**
   * Get username unique index name.
   *
   * @returns {string}
   */
  static get permalinkUniqueIndexName() {
    return 'uidx_2';
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {array<number>} [params.ids]
   * @param {array<string>} [params.permalinks]
   * @param {array<string>} [params.createdAt]
   * @param {array<string>} [params.name]
   * @param {array<string>} [params.status]
   * @param {array<string>} [params.trendingRank]
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

    if (params.createdAt || params.status) {
      const ChannelNewCache = require(rootPrefix + '/lib/cacheManagement/single/channel/ChannelNew');
      promisesArray.push(new ChannelNewCache({}).clear());
    }

    if (params.createdAt || params.status || params.name) {
      const ChannelAllCache = require(rootPrefix + '/lib/cacheManagement/single/channel/ChannelAll');
      promisesArray.push(new ChannelAllCache({}).clear());
    }

    if (params.trendingRank) {
      const ChannelTrendingCache = require(rootPrefix + '/lib/cacheManagement/single/channel/ChannelTrending');
      promisesArray.push(new ChannelTrendingCache({}).clear());
    }

    // If there is update in any channel, then flush list cache as well
    const DefaultChannelsListForWeb = require(rootPrefix + '/lib/cacheManagement/single/DefaultChannelsListForWeb');
    await new DefaultChannelsListForWeb().clear();

    await Promise.all(promisesArray);
  }
}

module.exports = ChannelModel;
