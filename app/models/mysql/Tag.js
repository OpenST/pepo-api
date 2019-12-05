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
   * @param {number} dbRow.user_bio_weight
   * @param {number} dbRow.video_weight
   * @param {number} dbRow.reply_weight
   * @param {number} dbRow.status
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @returns {object}
   * @private
   */
  _formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      name: dbRow.name,
      user_bio_weight: dbRow.user_bio_weight,
      videoWeight: dbRow.video_weight,
      replyWeight: dbRow.reply_weight,
      status: tagConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Get tags ids for given tag names.
   *
   * @param {array} tagNames
   *
   * @returns {Promise<void>}
   */
  async getTagIds(tagNames) {
    const oThis = this;

    const response = {};

    const dbRows = await oThis
      .select(['id', 'name'])
      .where({ name: tagNames })
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis._formatDbData(dbRows[index]);
      response[formatDbRow.name] = formatDbRow.id;
    }

    return response;
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

    return oThis.insertMultiple(['name', 'user_bio_weight', 'status'], insertArray, { touch: true }).fire();
  }

  /**
   * Get tags that starts with tag prefix.
   *
   * @param {object} params
   * @param {number} params.page
   * @param {number} params.limit
   * @param {string} params.tagPrefix
   *
   * @returns {Promise<{}>}
   */
  async getTagsByPrefix(params) {
    const oThis = this;

    const page = params.page || 1,
      limit = params.limit || 10,
      offset = (page - 1) * limit;

    const dbRows = await oThis
      .select('*')
      .where('name LIKE "' + params.tagPrefix + '%"')
      .where({ status: tagConstants.invertedStatuses[tagConstants.activeStatus] })
      .limit(limit)
      .offset(offset)
      .order_by('(user_bio_weight + video_weight + reply_weight) DESC')
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
   * @returns {Promise<{}>}
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
   * Update tag weights by weightToAdd.
   *
   * @param {array} tagIds
   * @param {number} weightToAdd
   *
   * @returns {Promise<*>}
   */
  async updateTagWeights(tagIds, weightToAdd) {
    const oThis = this;

    if (tagIds.length === 0) {
      return true;
    }

    const queryObj = oThis.update(['user_bio_weight = user_bio_weight + ?', weightToAdd]).where({ id: tagIds });

    if (weightToAdd < 0) {
      queryObj.where(['user_bio_weight + ? >= 0', weightToAdd]);
    }

    return queryObj.fire();
  }

  /**
   * Update video tag weights by weightToAdd.
   *
   * @param {array} tagIds
   * @param {number} weightToAdd
   *
   * @returns {Promise<*>}
   */
  async updateVideoTagWeights(tagIds, weightToAdd) {
    const oThis = this;

    const queryObj = oThis.update(['video_weight = video_weight + ?', weightToAdd]).where({ id: tagIds });

    if (weightToAdd < 0) {
      queryObj.where(['video_weight + ? >= 0', weightToAdd]);
    }

    return queryObj.fire();
  }

  /**
   * Update reply tag weights by weightToAdd.
   *
   * @param {array} tagIds
   * @param {number} weightToAdd
   *
   * @returns {Promise<*>}
   */
  async updateReplyTagWeights(tagIds, weightToAdd) {
    const oThis = this;

    const queryObj = oThis.update(['reply_weight = reply_weight + ?', weightToAdd]).where({ id: tagIds });

    if (weightToAdd < 0) {
      queryObj.where(['reply_weight + ? >= 0', weightToAdd]);
    }

    return queryObj.fire();
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {string} params.tagPrefix
   * @param {array} params.ids
   * @param {string} params.name
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

    if (params.name) {
      const TagIdByNames = require(rootPrefix + '/lib/cacheManagement/multi/TagIdByNames');
      promisesArray.push(new TagIdByNames({ names: [params.name] }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = Tag;
