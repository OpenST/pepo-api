const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.entityDbName;

/**
 * Class for video tag model.
 *
 * @class VideoTag
 */
class VideoTag extends ModelBase {
  /**
   * Constructor for video tag model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'video_tags';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.tag_id
   * @param {number} dbRow.video_id
   * @param {number} dbRow.video_kind
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      tagId: dbRow.tag_id,
      videoId: dbRow.video_id,
      videoKind: videoTagConstants.kinds[dbRow.video_kind],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return ['id', 'tagId', 'videoId', 'videoKind', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch video tags by video ids.
   *
   * @param {array} videoIds
   *
   * @returns {Promise<void>}
   */
  async fetchByVideoIds(videoIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('tag_id')
      .where({ video_id: videoIds })
      .fire();

    const response = {};

    for (let index = 0; index < videoIds.length; index++) {
      response[videoIds[index]] = [];
    }

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.videoId] = formatDbRow.tagId;
    }

    return response;
  }

  /**
   * Fetch video ids by tag ids.
   *
   * @param {array} tagIds
   *
   * @returns {Promise<void>}
   */
  async fetchVideoIdsByTagIds(tagIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ tag_id: tagIds })
      .fire();

    const tagIdToVideoIdMap = {};

    for (let index = 0; index < tagIds.length; index++) {
      tagIdToVideoIdMap[tagIds[index]] = [];
    }

    for (let index = 0; index < dbRows.length; index++) {
      const dbRow = dbRows[index];
      tagIdToVideoIdMap[dbRow.tag_id].push(dbRow.video_id);
    }

    return tagIdToVideoIdMap;
  }

  /**
   * Fetch by tag id.
   *
   * @param {integer} params.tagId: tag id
   * @param {integer} params.limit: no of rows to fetch
   * @param {integer} params.paginationTimestamp
   * @param {string} params.kind
   *
   * @returns {Promise}
   */
  async fetchByTagId(params) {
    const oThis = this;

    const limit = params.limit,
      tagId = params.tagId,
      paginationTimestamp = params.paginationTimestamp,
      videoCacheKeyKind = params.kind;

    const queryObject = oThis
      .select('*')
      .where({
        tag_id: tagId
      })
      .order_by('id desc')
      .limit(limit);

    if (paginationTimestamp) {
      queryObject.where(['created_at < ?', paginationTimestamp]);
    }

    switch (videoCacheKeyKind) {
      case videoTagConstants.postCacheKeyKind: {
        queryObject.where(['video_kind = ?', videoTagConstants.invertedKinds[videoTagConstants.postKind]]);
        break;
      }
      case videoTagConstants.replyCacheKeyKind: {
        queryObject.where(['video_kind = ?', videoTagConstants.invertedKinds[videoTagConstants.replyKind]]);
        break;
      }
      default: {
        // Do nothing.
      }
    }

    const dbRows = await queryObject.fire();

    const videoTagsDetails = [];

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);

      videoTagsDetails.push(formatDbRow);
    }

    return videoTagsDetails;
  }

  /**
   * Delete video tags by video ids.
   *
   * @returns {Promise<void>}
   */
  async deleteByVideoId(videoId) {
    const oThis = this;

    await oThis
      .delete()
      .where({ video_id: videoId })
      .fire();
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.tagId
   * @param {array<number>} params.tagIds
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promiseArray = [];
    let tagIds = [];

    if (params.tagId) {
      tagIds.push(params.tagId);
    } else if (params.tagIds) {
      tagIds = params.tagIds;
    }
    if (tagIds.length > 0) {
      const VideoIdsByTagIdPagination = require(rootPrefix + '/lib/cacheManagement/single/VideoTagsByTagIdPagination');
      for (let index = 0; index < tagIds.length; index++) {
        promiseArray.push(new VideoIdsByTagIdPagination({ tagId: tagIds[index] }).clear());
      }

      await Promise.all(promiseArray);
    }
  }
}

module.exports = VideoTag;
