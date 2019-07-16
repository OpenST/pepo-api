const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  imageConst = require(rootPrefix + '/lib/globalConstant/image');

const dbName = 'pepo_api_' + coreConstants.environment;

/**
 * Class for image model.
 *
 * @class
 */
class Image extends ModelBase {
  /**
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'images';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.resolutions
   * @param {number} dbRow.status
   * @param {string} dbRow.created_at
   * @param {string} dbRow.updated_at
   *
   * @return {object}
   * @private
   */
  _formatDbData(dbRow) {
    return {
      id: dbRow.id,
      resolutions: JSON.parse(dbRow.resolutions),
      status: imageConst.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Fetch image by id
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
   * Fetch images for given ids
   *
   * @param ids {array} - image ids
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
   * Insert into images
   *
   * @param params {object} - params
   *
   * @return {object}
   */
  async insertImage(params) {
    const oThis = this;

    return oThis
      .insert({
        resolutions: JSON.stringify(params.resolutions),
        kind: imageConst.invertedKinds[params.kind],
        status: imageConst.invertedStatuses[params.status]
      })
      .fire();
  }

  /**
   * Update image by id and kind
   *
   * @param params
   * @return {Promise<void>}
   */
  async updateByIdAndKind(params) {
    const oThis = this;

    let response = await oThis
      .update({
        resolutions: JSON.stringify(params.resolutions),
        status: imageConst.invertedStatuses[params.status]
      })
      .where({
        id: params.id
      })
      .fire();

    return response;
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
    const ImageByIds = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds');

    await new ImageByIds({
      ids: [params.id]
    }).clear();
  }
}

module.exports = Image;
