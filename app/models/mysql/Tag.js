const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  tagConstants = require(rootPrefix + '/lib/globalConstant/tag'),
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.entityDbName;

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
      status: tagConstants.statuses[dbRow.status],
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
      .select('*')
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
   *
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
   * Get tags that starts with tag prefix.
   *
   * @param {object} params
   * @param {number} params.page
   * @param {number} params.limit
   * @param {string} params.tagPrefix
   *
   * @returns {Promise<>}
   */
  async getTagsByPrefix(params) {
    const oThis = this;

    const page = params.page || 1,
      limit = params.limit || 10,
      offset = (page - 1) * limit;

    const dbRows = await oThis
      .select('*')
      .where('name LIKE "' + params.tagPrefix + '%"')
      .limit(limit)
      .offset(offset)
      .order_by('weight DESC')
      .fire();

    let response = [];

    for (let index = 0; index < dbRows.length; index++) {
      response.push(dbRows[index].id);
    }

    return response;
  }

  /***
   * Fetch tag for id.
   *
   * @param {array} ids  - ids
   *
   * @return {Object}
   */
  async fetchByIds(ids) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where(['id IN (?)', ids])
      .fire();

    let response = {};

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis._formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Update tag weights by 1
   *
   * @param tagIds
   * @param weightToAdd
   * @returns {Promise<any>}
   */
  updateTagWeights(tagIds, weightToAdd) {
    const oThis = this;

    return oThis
      .update(['weight=weight+?', weightToAdd])
      .where({ id: tagIds })
      .fire();
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const TagPagination = require(rootPrefix + '/lib/cacheManagement/single/TagPagination');
    await new TagPagination({
      tagPrefix: [params.tagPrefix]
    }).clear();

    const TagByIds = require(rootPrefix + '/lib/cacheManagement/multi/Tag');
    await new TagByIds({ ids: params.ids }).clear();
  }
}

module.exports = Tag;
