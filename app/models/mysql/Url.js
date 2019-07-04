const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  urlConst = require(rootPrefix + '/lib/globalConstant/url');

const dbName = 'pepo_api_' + coreConstants.environment;

/**
 * Class for url model.
 *
 * @class
 */
class Url extends ModelBase {
  /**
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'urls';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.url
   * @param {number} dbRow.kind
   * @param {string} dbRow.created_at
   * @param {string} dbRow.updated_at
   *
   * @return {object}
   * @private
   */
  _formatDbData(dbRow) {
    return {
      id: dbRow.id,
      url: dbRow.url,
      kind: urlConst.kinds[dbRow.kind],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Fetch url by id
   *
   * @param id {integer} - id
   *
   * @return {object}
   */
  async fetchById(id) {
    const oThis = this;

    let dbRows = await oThis.fetchByIds([id]);

    return dbRows[id] || {};
  }

  /**
   * Fetch url for given ids
   *
   * @param ids {array} - url ids
   *
   * @return {object}
   */
  async fetchByIds(ids) {
    const oThis = this;
    let response = {};

    let dbRows = await oThis
      .select('*')
      .where(['id IN (?)', ids])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis._formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Insert into urls
   *
   * @param params {object} - params
   *
   * @return {object}
   */
  async insertUrl(params) {
    const oThis = this;

    let response = await oThis
      .insert({
        url: params.url,
        kind: urlConst.invertedKinds[params.kind]
      })
      .fire();

    return response.data;
  }

  /**
   * Update url by id
   *
   * @param params
   * @return {Promise<void>}
   */
  async updateByIdAndKind(params) {
    const oThis = this;

    let response = await oThis
      .update({
        url: params.url
      })
      .where({
        id: params.id,
        kind: urlConst.invertedKinds[params.kind]
      })
      .fire();

    return response.data;
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
    const UrlsByIds = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds');

    await new UrlsByIds({
      ids: [params.id]
    }).clear();
  }
}

module.exports = Url;
