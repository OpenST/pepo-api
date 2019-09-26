const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
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
    return ['id', 'tagId', 'videoId', 'createdAt', 'updatedAt'];
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
      .select('*')
      .where({ video_id: videoIds })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.videoId] = formatDbRow;
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
   * @returns {Promise<*>}
   */
  static async flushCache() {
    // Do nothing.
  }
}

module.exports = VideoTag;
