const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  gifCategoryConstant = require(rootPrefix + '/lib/globalConstant/gifCategory');

// Declare variables.
const dbName = databaseConstants.entityDbName;

/**
 * Class for GifCategory model.
 *
 * @class GifCategory
 */
class GifCategory extends ModelBase {
  /**
   * Constructor for GifCategory model.
   *
   * @augments ModelBase
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
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      name: dbRow.name,
      gifId: dbRow.gif_id,
      gifData: JSON.parse(dbRow.gif_data),
      kind: gifCategoryConstant.kinds[dbRow.kind],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch all categories of gifs.
   *
   * @returns {Promise<*>}
   */
  async fetchAllCategories() {
    const oThis = this;

    const dbRows = await oThis.select('*').fire();

    if (dbRows.length === 0) {
      return Promise.reject(new Error('No entry found in categories table.'));
    }

    const formattedData = [];
    for (let index = 0; index < dbRows.length; index++) {
      formattedData.push(oThis._formatDbData(dbRows[index]));
    }

    return formattedData;
  }
}

module.exports = GifCategory;
