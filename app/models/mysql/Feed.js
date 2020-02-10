const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  feedsConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.feedDbName;

/**
 * Class for feed model.
 *
 * @class FeedModel
 */
class FeedModel extends ModelBase {
  /**
   * Constructor for feed model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'feeds';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      primaryExternalEntityId: dbRow.primary_external_entity_id,
      kind: feedsConstants.kinds[dbRow.kind],
      paginationIdentifier: dbRow.pagination_identifier,
      actor: dbRow.actor,
      isPopular: dbRow.is_popular,
      lastReplyTimestamp: dbRow.last_reply_timestamp,
      extraData: dbRow.hasOwnProperty('extra_data') ? JSON.parse(dbRow.extra_data) : undefined,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch feed by externalEntityId.
   *
   * @param {number} externalEntityId
   *
   * @return {object}
   */
  async fetchByPrimaryExternalEntityId(externalEntityId) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ primary_external_entity_id: externalEntityId })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /**
   * Fetch feed by id.
   *
   * @param {number} id: id
   *
   * @return {object}
   */
  async fetchById(id) {
    const oThis = this;

    const dbRows = await oThis.fetchByIds([id]);

    return dbRows[id] || {};
  }

  /**
   * Fetch new feeds ids after last visit time.
   *
   * @param {Object} params
   * @param {array} params.limit: limit
   *
   * @return {object}
   */
  async getLatestFeedIds(params) {
    const oThis = this,
      limit = params.limit;

    const response = { feedIds: [], feedsMap: {} };

    const dbRows = await oThis
      .select('id, pagination_identifier, primary_external_entity_id, actor, is_popular, last_reply_timestamp')
      .order_by('pagination_identifier desc')
      .limit(limit)
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response.feedIds.push(formatDbRow.id);
      response.feedsMap[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Fetch feeds ids after pagination Timestamp.
   *
   * @param params
   * @return {Promise<{feedIds: Array, feedsMap: {}}>}
   */
  async getPersonalizedFeedIdsAfterTimestamp(params) {
    const oThis = this,
      offset = params.offset,
      paginationTimestamp = params.paginationTimestamp,
      limit = params.limit;

    const response = { feedIds: [], feedsMap: {} };

    const queryObj = oThis
      .select('*')
      .where(['pagination_identifier < ?', paginationTimestamp])
      .order_by('pagination_identifier desc')
      .limit(limit)
      .offset(offset);

    const dbRows = await queryObj.fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response.feedIds.push(formatDbRow.id);
      response.feedsMap[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Fetch feeds for given ids.
   *
   * @param {array} ids: Feed Ids
   *
   * @return {object}
   */
  async fetchByIds(ids) {
    const oThis = this;

    const response = {};

    const dbRows = await oThis
      .select('*')
      .where(['id IN (?)', ids])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Delete by actor.
   *
   * @param {object} params
   * @param {number} params.actor
   *
   * @returns {Promise<object>}
   */
  async deleteByActor(params) {
    const oThis = this;

    await oThis
      .delete()
      .where({
        actor: params.actor
      })
      .fire();

    return FeedModel.flushCache({});
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {array<number>} [params.ids]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    const LoggedOutFeedCache = require(rootPrefix + '/lib/cacheManagement/single/LoggedOutFeed');
    promisesArray.push(new LoggedOutFeedCache({}).clear());

    const LatestFeedCache = require(rootPrefix + '/lib/cacheManagement/single/LatestFeed');
    promisesArray.push(new LatestFeedCache({}).clear());

    if (params.ids) {
      const FeedByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/FeedByIds');
      promisesArray.push(new FeedByIdsCache({ ids: params.ids }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = FeedModel;
