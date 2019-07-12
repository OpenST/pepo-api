const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

/**
 * Class for text model.
 *
 * @class
 */
class Text extends ModelBase {
  /**
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'texts';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.text
   * @param {string} dbRow.tag_ids
   * @param {string} dbRow.created_at
   * @param {string} dbRow.updated_at
   *
   * @return {object}
   * @private
   */
  formatDbData(dbRow) {
    return {
      id: dbRow.id,
      text: dbRow.text,
      tagIds: dbRow.tag_ids,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Fetch text by id
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
   * Fetch text for given ids
   *
   * @param ids {array} - text ids
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
      let formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Insert into texts
   *
   * @param params {object} - params
   *
   * @return {object}
   */
  async insertText(params) {
    const oThis = this;

    return oThis
      .insert({
        text: params.text,
        tag_ids: JSON.stringify(params.tagIds)
      })
      .fire();
  }

  /**
   * Update text by id
   *
   * @param params
   * @return {Promise<void>}
   */
  async updateById(params) {
    const oThis = this;

    let response = await oThis
      .update({
        text: params.text
      })
      .where({
        id: params.id
      })
      .fire();

    return response.data;
  }

  /**
   * Delete by id
   *
   * @param params
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
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.id
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const TextsByIds = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds');

    await new TextsByIds({
      ids: [params.id]
    }).clear();
  }
}

module.exports = Text;
