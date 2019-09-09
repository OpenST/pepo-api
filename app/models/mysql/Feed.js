const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  feedsConstants = require(rootPrefix + '/lib/globalConstant/feed');

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
      extraData: JSON.parse(dbRow.extra_data),
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
   * Delete by actor
   *
   * @param {number} actor - actor id
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
   * @param {number} params.paginationTimestamp
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const LoggedOutFeed = require(rootPrefix + '/lib/cacheManagement/single/LoggedOutFeed');

    await new LoggedOutFeed({
      limit: paginationConstants.defaultFeedsListPageSize,
      paginationTimestamp: params.paginationTimestamp
    }).clear();
  }
}

module.exports = FeedModel;
