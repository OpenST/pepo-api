const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  urlConstants = require(rootPrefix + '/lib/globalConstant/url'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.entityDbName;

/**
 * Class for url model.
 *
 * @class Url
 */
class Url extends ModelBase {
  /**
   * Constructor for url model.
   *
   * @augments ModelBase
   *
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
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      url: dbRow.url,
      kind: urlConstants.kinds[dbRow.kind],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch url by id.
   *
   * @param {integer} id
   *
   * @return {object}
   */
  async fetchById(id) {
    const oThis = this;

    const dbRows = await oThis.fetchByIds([id]);

    return dbRows[id] || {};
  }

  /**
   * Fetch url for given ids.
   *
   * @param {array} ids: url ids
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
      const formatDbRow = oThis._formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Insert into urls.
   *
   * @param {object} params
   * @param {string} params.url
   * @param {string} params.kind
   *
   * @return {object}
   */
  async insertUrl(params) {
    const oThis = this;

    const response = await oThis
      .insert({
        url: params.url,
        kind: urlConstants.invertedKinds[params.kind]
      })
      .fire();

    return response;
  }

  /**
   * Update url by id.
   *
   * @param {object} params
   * @param {string} params.url
   * @param {number} params.id
   *
   * @return {Promise<void>}
   */
  async updateById(params) {
    const oThis = this;

    return oThis
      .update({
        url: params.url
      })
      .where({
        id: params.id
      })
      .fire();
  }

  /**
   * Delete by id.
   *
   * @param {object} params
   * @param {number} params.id
   * @param {string} params.kind
   *
   * @return {Promise<void>}
   */
  async deleteByIdAndKind(params) {
    const oThis = this;

    await oThis
      .delete()
      .where({
        id: params.id,
        kind: urlConstants.invertedKinds[params.kind]
      })
      .fire();
  }

  /**
   * Delete by id.
   *
   * @param {object} params
   * @param {number} params.id
   *
   * @return {Promise<void>}
   */
  async deleteById(params) {
    const oThis = this;

    await oThis
      .delete()
      .where({
        id: params.id
      })
      .fire();
  }

  /**
   * Get url details.
   *
   * @param {array} url
   *
   * @returns {Promise<void>}
   */
  async getUrls(url) {
    const oThis = this;

    return oThis
      .select('*')
      .where({ url: url })
      .fire();
  }

  /**
   * Insert urls.
   *
   * @param {array} insertArray
   *
   * @returns {Promise<*>}
   */
  async insertUrls(insertArray) {
    const oThis = this;

    return oThis.insertMultiple(['url', 'kind'], insertArray, { touch: true }).fire();
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
