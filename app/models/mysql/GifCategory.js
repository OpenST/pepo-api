const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  database = require(rootPrefix + '/lib/globalConstant/database'),
  gifCategoryConstant = require(rootPrefix + '/lib/globalConstant/gifCategory');

const dbName = database.entityDbName;

/**
 * Class for GifCategory model.
 *
 * @class
 */
class GifCategory extends ModelBase {
  /**
   * GifCategory model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'gif_categories';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.name
   * @param {string} dbRow.gif_id
   * @param {string} dbRow.gif_data
   * @param {string} dbRow.kind
   * @param {string} dbRow.created_at
   * @param {string} dbRow.updated_at
   *
   * @return {object}
   * @private
   */
  _formatDbData(dbRow) {
    return {
      id: dbRow.id,
      name: dbRow.name,
      gifId: dbRow.gif_id,
      gifData: JSON.parse(dbRow.gif_data),
      kind: gifCategoryConstant.kinds[dbRow.kind],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Fetch All categories of Gifs
   *
   * @returns {Promise<*>}
   */
  async fetchAllCategories() {
    const oThis = this;

    const dbRows = await oThis.select('*').fire();

    if (dbRows.length === 0) {
      return Promise.reject(new Error(`No entry found in categories table.`));
    }

    let formattedData = [];
    for (let i = 0; i < dbRows.length; i++) {
      formattedData.push(oThis._formatDbData(dbRows[i]));
    }

    return formattedData;
  }
}

module.exports = GifCategory;
