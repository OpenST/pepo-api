const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  imageConst = require(rootPrefix + '/lib/globalConstant/image'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.entityDbName;

/**
 * Class for image model.
 *
 * @class Image
 */
class Image extends ModelBase {
  /**
   * Constructor for image model.
   *
   * @augments ModelBase
   *
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
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      resolutions: JSON.parse(dbRow.resolutions),
      status: imageConst.statuses[dbRow.status],
      kind: imageConst.kinds[dbRow.kind],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch image by id
   *
   * @param {number} id
   *
   * @return {object}
   */
  async fetchById(id) {
    const oThis = this;

    const dbRows = await oThis.fetchByIds([id]);

    return dbRows[id] || {};
  }

  /**
   * Fetch images for given ids
   *
   * @param {array} ids: image ids
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

      for (const resolution in formatDbRow.resolutions) {
        const shortUrl = formatDbRow.resolutions[resolution].url;

        formatDbRow.resolutions[resolution].url = shortToLongUrl.getFullUrl(shortUrl);
      }

      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Insert into images.
   *
   * @param {object} params
   * @param {string} params.resolutions
   * @param {number} params.kind
   * @param {number} params.status
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
