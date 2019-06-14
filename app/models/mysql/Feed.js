const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  feedsConstants = require(rootPrefix + '/lib/globalConstant/feed');

const dbName = 'pepo_api_' + coreConstants.environment;

class FeedModel extends ModelBase {
  /**
   * Constructor for feed model.
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
    return {
      id: dbRow.id,
      kind: feedsConstants.kinds[dbRow.kind],
      primaryExternalEntityId: dbRow.primary_external_entity_id,
      extraData: JSON.parse(dbRow.extra_data),
      privacyType: feedsConstants.privacyTypes[dbRow.privacy_type],
      status: feedsConstants.statuses[dbRow.status],
      publishedTs: dbRow.published_ts,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Fetch public and published feed ids.
   *
   * @param {object} params
   * @param {number/string} [params.page]
   * @param {number/string} [params.limit]
   *
   *  @returns {Promise<Array>}
   */
  async fetchPublicPublishedFeedIds(params) {
    const oThis = this;

    const page = params.page || 1,
      limit = params.limit || 10,
      offset = (page - 1) * limit;

    const feedIds = [];

    const dbRows = await oThis
      .select('id')
      .where({
        status: feedsConstants.invertedStatuses[feedsConstants.publishedStatus],
        privacy_type: feedsConstants.invertedPrivacyTypes[feedsConstants.publicPrivacyType]
      })
      .limit(limit)
      .offset(offset)
      .order_by('published_ts DESC')
      .fire();

    if (dbRows.length === 0) {
      return [];
    }

    for (let index = 0; index < dbRows.length; index++) {
      feedIds.push(dbRows[index].id);
    }

    return feedIds;
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
   * @return {Object}
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
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.id
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const FeedByIds = require(rootPrefix + '/lib/cacheManagement/multi/FeedByIds');

    await new FeedByIds({
      ids: [params.id]
    }).clear();
  }
}

module.exports = FeedModel;
