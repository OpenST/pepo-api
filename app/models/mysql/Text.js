const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.entityDbName;

/**
 * Class for text model.
 *
 * @class Text
 */
class Text extends ModelBase {
  /**
   * Constructor for text model.
   *
   * @augments ModelBase
   *
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
   * @param {number} dbRow.kind
   * @param {string} dbRow.created_at
   * @param {string} dbRow.updated_at
   *
   * @returns {object}
   * @private
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      text: dbRow.text,
      kind: textConstants.kinds[dbRow.kind],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch text by id.
   *
   * @param {number} id
   *
   * @returns Promise{<object>}
   */
  async fetchById(id) {
    const oThis = this;

    const dbRows = await oThis.fetchByIds([id]);

    return dbRows[id] || {};
  }

  /**
   * Fetch text for given ids.
   *
   * @param {array} ids: text ids
   *
   * @returns Promise{<object>}
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
   * Insert into texts table.
   *
   * @param {object} params
   * @param {string} params.text
   * @param {string} params.kind
   *
   * @returns {object}
   */
  async insertText(params) {
    const oThis = this;

    const insertParams = {
      text: params.text,
      kind: textConstants.invertedKinds[params.kind]
    };

    return oThis.insert(insertParams).fire();
  }

  /**
   * Update text by id.
   *
   * @param {object} params
   * @param {number} params.text
   * @param {string} params.id
   *
   * @returns {Promise<void>}
   */
  async updateById(params) {
    const oThis = this;

    return oThis
      .update({
        text: params.text
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
   *
   * @returns {Promise<void>}
   */
  async deleteById(params) {
    const oThis = this;

    await oThis
      .delete()
      .where({ id: params.id })
      .fire();
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {array<number>} params.ids
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const TextByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds');

    await new TextByIdCache({ ids: params.ids }).clear();
  }
}

module.exports = Text;
