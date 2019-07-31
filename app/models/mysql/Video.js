const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
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
   * @param {string} dbRow.url_template
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
      urlTemplate: dbRow.url_template,
      resolutions: JSON.parse(dbRow.resolutions),
      posterImageId: dbRow.poster_image_id,
      status: videoConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Format resolutions hash.
   *
   * @param {object} resolution
   *
   * @returns {object}
   * @private
   */
  _formatResolution(resolution) {
    const oThis = this;

    const formattedData = {
      url: resolution.u,
      size: resolution.s,
      height: resolution.h,
      width: resolution.w
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Formats the complete resolution hash.
   *
   * @param {object} resolutions
   * @param {string} urlTemplate
   *
   * @returns {object}
   * @private
   */
  _formatResolutions(resolutions, urlTemplate) {
    const oThis = this;

    const responseResolutionHash = {};

    for (const resolution in resolutions) {
      let responseResolution = resolution;
      if (resolution === 'o') {
        responseResolution = 'original';
        responseResolutionHash[responseResolution] = oThis._formatResolution(resolutions[resolution]);
        responseResolutionHash[responseResolution].url = shortToLongUrl.getFullUrl(
          responseResolutionHash[responseResolution].url
        );
      } else {
        responseResolutionHash[responseResolution] = oThis._formatResolution(resolutions[resolution]);
        responseResolutionHash[responseResolution].url = shortToLongUrl.getFullUrl(urlTemplate, responseResolution);
      }
    }

    return responseResolutionHash;
  }

  /**
   * Fetch video by id.
   *
   * @param {integer} id
   *
   * @returns {object}
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
   * @returns {object}
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
      formatDbRow.resolutions = oThis._formatResolutions(formatDbRow.resolutions, formatDbRow.urlTemplate);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Insert into videos.
   *
   * @param {object} params
   * @param {object} params.resolutions
   * @param {number} params.posterImageId
   * @param {string} params.status
   *
   * @return {Promise<object>}
   */
  async insertVideo(params) {
    const oThis = this;

    const resolutions = oThis._formatResolutionsToInsert(params.resolutions);

    return oThis
      .insert({
        resolutions: JSON.stringify(resolutions),
        poster_image_id: params.posterImageId,
        status: videoConstants.invertedStatuses[params.status]
      })
      .fire();
  }

  /**
   * Update videos table.
   *
   * @param {object} params
   * @param {number/string} params.id
   * @param {string} params.urlTemplate
   * @param {object} params.resolutions
   * @param {string} params.status
   *
   * @return {Promise<object>}
   */
  async updateVideo(params) {
    const oThis = this;

    const resolutions = oThis._formatResolutionsToInsert(params.resolutions);

    return oThis
      .update({
        url_template: params.urlTemplate,
        resolutions: JSON.stringify(resolutions),
        status: videoConstants.invertedStatuses[params.status]
      })
      .where({ id: params.id })
      .fire();
  }

  /**
   * Format resolutions to insert.
   *
   * @param {object} resolutions
   *
   * @returns {object}
   * @private
   */
  _formatResolutionsToInsert(resolutions) {
    const oThis = this;

    const responseResolutionHash = {};

    for (const resolution in resolutions) {
      if (resolution === 'original') {
        responseResolutionHash.o = oThis._formatResolutionToInsert(resolutions[resolution]);
        responseResolutionHash.o.u = resolutions[resolution].url;
      } else {
        responseResolutionHash[resolution] = oThis._formatResolutionToInsert(resolutions[resolution]);
        responseResolutionHash[resolution].u = resolutions[resolution].url;
      }
    }

    return responseResolutionHash;
  }

  /**
   * Format resolution to insert.
   *
   * @param {object} resolution
   *
   * @returns {object}
   * @private
   */
  _formatResolutionToInsert(resolution) {
    const oThis = this;

    const formattedData = {
      s: resolution.size,
      h: resolution.height,
      w: resolution.width
    };

    return oThis.sanitizeFormattedData(formattedData);
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
