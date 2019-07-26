const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.entityDbName;

/**
 * Class for video model.
 *
 * @class Video
 */
class Video extends ModelBase {
  /**
   * Constructor for video model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'videos';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.resolutions
   * @param {number} dbRow.poster_image_id
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
      posterImageId: dbRow.poster_image_id,
      status: videoConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch video by id.
   *
   * @param {integer} id
   *
   * @return {object}
   */
  async fetchById(id) {
    const oThis = this;

    const dbRows = await oThis.fetchByIds([id]);

    return dbRows[id] || {};
  }

  /**
   * Fetch videos for given ids.
   *
   * @param {array} ids
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
      for (const resolutionKind in formatDbRow.resolutions) {
        const shortUrl = formatDbRow.resolutions[resolutionKind].url;
        formatDbRow.resolutions[resolutionKind].url = s3Constants.shortToLongUrlForResponse(shortUrl);
      }
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Insert into videos
   *
   * @param {object} params
   * @param {object} params.resolutions
   * @param {number} params.posterImageId
   * @param {string} params.status
   *
   * @return {object}
   */
  insertVideo(params) {
    const oThis = this;

    return oThis
      .insert({
        resolutions: JSON.stringify(params.resolutions),
        poster_image_id: params.posterImageId,
        status: videoConstants.invertedStatuses[params.status]
      })
      .fire();
  }

  /**
   * Update image by id.
   *
   * @param {object} params
   * @param {number} params.id
   * @param {object} params.resolutions
   * @param {number} params.posterImageId
   * @param {string} params.status
   *
   * @return {Promise<void>}
   */
  async updateById(params) {
    const oThis = this;

    const response = await oThis
      .update({
        resolutions: JSON.stringify(params.resolutions),
        status: videoConstants.invertedStatuses[params.status],
        poster_image_id: params.posterImageId
      })
      .where({
        id: params.id
      })
      .fire();

    return response.data;
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
    const VideoByIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds');

    await new VideoByIds({ ids: [params.id] }).clear();
  }
}

module.exports = Video;
