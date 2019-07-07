const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

/**
 * Class for tag model.
 *
 * @class
 */
class Tag extends ModelBase {
  /**
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'tags';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.name
   * @param {string} dbRow.weight
   * @param {string} dbRow.status
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
      weight: dbRow.weight,
      status: dbRow.status,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Get tags.
   *
   * @param {array} names
   * @returns {Promise<void>}
   */
  async getTags(names) {
    const oThis = this;

    return oThis
      .select('name, weight')
      .where({ name: names })
      .fire();
  }

  /**
   * Insert tags.
   *
   * @param {array} insertArray
   * @returns {Promise<void|Object<self>>}
   */
  async insertTags(insertArray) {
    const oThis = this;

    return oThis.insertMultiple(['name', 'weight', 'status'], insertArray, { touch: true }).fire();
  }

  /**
   * Update tag weight.
   *
   * @param caseStatement
   * @param tags
   * @returns {Promise<*>}
   */
  async updateTags(caseStatement, tags) {
    const oThis = this;

    return oThis
      .update(caseStatement)
      .where({ name: tags })
      .fire();
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {}
}

module.exports = Tag;
