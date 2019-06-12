const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  feedsConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

class FeedModel extends ModelBase {
  /**
   * Feed model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'feeds';
  }

  /**
   *
   * @param dbRow
   * @return {object}
   */
  formatDbData(dbRow) {
    return {
      id: dbRow.id,
      kind: feedsConstants.kinds[dbRow.kind],
      primaryExternalEntityId: dbRow.primary_external_entity_id,
      extraData: JSON.parse(dbRow.extra_data),
      status: feedsConstants.statuses[dbRow.status],
      publishedTs: dbRow.published_ts,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /***
   * Fetch feed by externalEntityId
   *
   * @param externalEntityId {Integer} - externalEntityId
   *
   * @return {Object}
   */
  async fetchByPrimaryExternalEntityId(externalEntityId) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where({ primary_external_entity_id: externalEntityId })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }
    return oThis.formatDbData(dbRows[0]);
  }

  /***
   * Fetch feed by id
   *
   * @param id {Integer} - id
   *
   * @return {Object}
   */
  async fetchById(id) {
    const oThis = this;
    let dbRows = await oThis.fetchByIds([id]);

    return dbRows[id] || {};
  }

  /***
   * Fetch feeds for given ids
   *
   * @param Ids {Array} - Feed Ids
   *
   * @return {Object}
   */
  async fetchByIds(ids) {
    const oThis = this;
    let response = {};

    let dbRows = await oThis
      .select('*')
      .where(['id IN (?)', ids])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /***
   * Flush cache
   *
   * @param {object} params
   * @param {Integer} params.id
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
