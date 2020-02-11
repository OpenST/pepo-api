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

    await Url.flushCache({ ids: [response.insertId] });

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

    const response = await oThis
      .update({
        url: params.url
      })
      .where({
        id: params.id
      })
      .fire();

    await Url.flushCache({ ids: [params.id] });

    return response;
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

    await Url.flushCache({ ids: [params.id] });
  }

  /**
   * Delete by id.
   *
   * @param {object} params
   * @param {array} params.ids
   *
   * @return {Promise<void>}
   */
  async deleteByIds(params) {
    const oThis = this;

    await oThis
      .delete()
      .where({
        id: params.ids
      })
      .fire();

    await Url.flushCache({ ids: params.ids });
  }

  /**
   * Get url details.
   *
   * @param {array} urls
   *
   * @returns {Promise<void>}
   */
  async getUrls(urls) {
    const oThis = this;

    const Rows = await oThis
      .select('*')
      .where({ url: urls })
      .fire();

    const response = {};
    for (let ind = 0; ind < Rows.length; ind++) {
      const formattedRow = oThis._formatDbData(Rows[ind]);
      response[formattedRow.id] = formattedRow;
    }

    return response;
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
   * @param {number} [params.id]
   * @param {array<number>} [params.ids]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const UrlsByIds = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds');

    if (params.id) {
      await new UrlsByIds({ ids: [params.id] }).clear();
    }

    if (params.ids) {
      await new UrlsByIds({ ids: params.ids }).clear();
    }
  }
}

module.exports = Url;
