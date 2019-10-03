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
      extraData: dbRow.hasOwnProperty('extra_data') ? JSON.parse(dbRow.extra_data) : undefined,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch public and published feed ids.
   *
   * @param {object} params
   * @param {number/string} params.limit
   * @param {number/string} params.paginationTimestamp
   *
   *  @returns {Promise<object>}
   */
  async getLoggedOutFeedIds(params) {
    const oThis = this;

    const feedIds = [],
      feedDetails = {};

    const paginationTimestamp = params.paginationTimestamp,
      limit = params.limit;

    const queryObject = oThis
      .select('*')
      .order_by('pagination_identifier desc')
      .limit(limit);

    if (paginationTimestamp) {
      queryObject.where(['pagination_identifier < ?', paginationTimestamp]);
    }

    const dbRows = await queryObject.fire();

    if (dbRows.length === 0) {
      return { feedIds: feedIds, feedDetails: feedDetails };
    }

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);

      feedIds.push(formatDbRow.id);
      feedDetails[formatDbRow.id] = formatDbRow;
    }

    return { feedIds: feedIds, feedDetails: feedDetails };
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
   * @param {array} ids: Feed Ids
   *
   * @return {object}
   */
  async getLatestFeedIds(params) {
    const oThis = this,
      limit = params.limit;

    const response = { feedIds: [], feedsMap: {} };

    const dbRows = await oThis
      .select('id, pagination_identifier')
      .order_by('pagination_identifier desc')
      .limit(limit)
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response['feedIds'].push(formatDbRow.id);
      response['feedsMap'][formatDbRow.id] = formatDbRow.paginationIdentifier;
    }

    return response;
  }

  /**
   * Fetch new feeds ids after last visit time.
   *
   * @param {array} ids: Feed Ids
   *
   * @return {object}
   */
  async getPersonalizedFeedIdsAfterCache(params) {
    const oThis = this,
      offset = params.offset,
      previousFeedIds = params.previousFeedIds,
      limit = params.limit;

    const response = { feedIds: [], feedsMap: {} };

    let queryObj = oThis
      .select('*')
      .order_by('pagination_identifier desc')
      .limit(limit)
      .offset(offset);

    if (previousFeedIds.length > 0) {
      queryObj = queryObj.where(['id not in (?)', previousFeedIds]);
    }

    const dbRows = await queryObj.fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response['feedIds'].push(formatDbRow.id);
      response['feedsMap'][formatDbRow.id] = formatDbRow;
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
   * @return {object}
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
   * @param {number} [params.id]
   * @param {array<number>} [params.ids]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    const LoggedOutFeedCache = require(rootPrefix + '/lib/cacheManagement/single/LoggedOutFeed');
    promisesArray.push(new LoggedOutFeedCache({}).clear());

    if (params.id) {
      const FeedByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/FeedByIds');
      promisesArray.push(new FeedByIdsCache({ ids: [params.id] }).clear());
    }

    if (params.ids) {
      const FeedByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/FeedByIds');
      promisesArray.push(new FeedByIdsCache({ ids: params.ids }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = FeedModel;
