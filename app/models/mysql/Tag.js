const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  tagConstants = require(rootPrefix + '/lib/globalConstant/tag'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.entityDbName;

/**
 * Class for tag model.
 *
 * @class Tag
 */
class Tag extends ModelBase {
  /**
   * Constructor for tag model.
   *
   * @augments ModelBase
   *
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
   * @param {string} dbRow.video_weight
   * @param {string} dbRow.status
   * @param {string} dbRow.created_at
   * @param {string} dbRow.updated_at
   *
   * @returns {object}
   * @private
   */
  _formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      name: dbRow.name,
      weight: dbRow.weight,
      videoWeight: dbRow.video_weight,
      status: tagConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Get tags.
   *
   * @param {array} names
   *
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
   *
   * @returns {Promise<*>}
   */
  async insertTags(insertArray) {
    const oThis = this;

    return oThis.insertMultiple(['name', 'weight', 'status'], insertArray, { touch: true }).fire();
  }

  /**
   * Update tag weight.
   *
   * @param {string} caseStatement
   * @param {string} tags
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
      .order_by('(weight+video_weight) DESC')
      .fire();

    const response = [];

    for (let index = 0; index < dbRows.length; index++) {
      response.push(dbRows[index].id);
    }

    return response;
  }

  /**
   * Fetch tag for id.
   *
   * @param {array} ids
   *
   * @return {object}
   */
  async fetchByIds(ids) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where(['id IN (?)', ids])
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis._formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Update tag weights by weightToAdd
   *
   * @param {array} tagIds
   * @param {number} weightToAdd
   *
   * @returns {Promise<any>}
   */
  async updateTagWeights(tagIds, weightToAdd) {
    const oThis = this;

    let queryObj = oThis.update(['weight=weight+?', weightToAdd]).where({ id: tagIds });

    if (weightToAdd < 0) {
      queryObj.where(['weight > 0']);
    }

    return queryObj.fire();
  }

  /**
   * Update video tag weights by weightToAdd
   *
   * @param tagIds
   * @param weightToAdd
   * @returns {Promise<any>}
   */
  async updateVideoTagWeights(tagIds, weightToAdd) {
    const oThis = this;

    let queryObj = oThis.update(['video_weight=video_weight+?', weightToAdd]).where({ id: tagIds });

    if (weightToAdd < 0) {
      queryObj.where(['video_weight > 0']);
    }

    return queryObj.fire();
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {string} params.tagPrefix
   * @param {array} params.ids
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.tagPrefix) {
      const TagPagination = require(rootPrefix + '/lib/cacheManagement/single/TagPagination');
      promisesArray.push(new TagPagination({ tagPrefix: [params.tagPrefix] }).clear());
    }

    if (params.ids) {
      const TagByIds = require(rootPrefix + '/lib/cacheManagement/multi/Tag');
      promisesArray.push(new TagByIds({ ids: params.ids }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = Tag;
