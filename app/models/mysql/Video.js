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
   * @param {number} dbRow.kind
   * @param {number} dbRow.compression_status
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
      kind: videoConstants.kinds[dbRow.kind],
      compressionStatus: videoConstants.compressionStatuses[dbRow.compression_status],
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
      const longResolutionKey = videoConstants.invertedResolutionKeyToShortMap[resolution];

      responseResolutionHash[longResolutionKey] = oThis._formatResolution(resolutions[resolution]);

      const url = responseResolutionHash[longResolutionKey].url
        ? responseResolutionHash[longResolutionKey].url
        : urlTemplate;

      responseResolutionHash[longResolutionKey].url = shortToLongUrl.getFullUrl(url, longResolutionKey);
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
   * @param {string} params.kind
   * @param {string} params.compressionStatus
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
        status: videoConstants.invertedStatuses[params.status],
        kind: videoConstants.invertedKinds[params.kind],
        compression_status: videoConstants.invertedCompressionStatuses[params.compressionStatus]
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
   * @param {string} [params.status]
   * @param {string} [params.compressionStatus]
   *
   * @return {Promise<object>}
   */
  async updateVideo(params) {
    const oThis = this;

    const resolutions = oThis._formatResolutionsToUpdate(params.resolutions);

    const updateParams = {
      url_template: params.urlTemplate,
      resolutions: JSON.stringify(resolutions)
    };

    if (params.status) {
      updateParams.status = videoConstants.invertedStatuses[params.status];
    }

    if (params.compressionStatus) {
      updateParams.compression_status = videoConstants.invertedCompressionStatuses[params.compressionStatus];
    }

    return oThis
      .update(updateParams)
      .where({ id: params.id })
      .fire();
  }

  /**
   * Mark videos deleted.
   *
   * @param {object} params
   * @param {array<number/string>} params.ids
   *
   * @return {Promise<object>}
   */
  async markVideosDeleted(params) {
    const oThis = this;

    await oThis
      .update({
        status: videoConstants.invertedStatuses[videoConstants.deletedStatus]
      })
      .where({
        id: params.ids
      })
      .fire();

    await Video.flushCache({ ids: params.ids });
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
      const shortResolutionKey = videoConstants.resolutionKeyToShortMap[resolution];

      responseResolutionHash[shortResolutionKey] = oThis._formatResolutionToInsert(resolutions[resolution]);

      // While inserting original url has to be present in original resolutions hash only.
      if (resolution === videoConstants.originalResolution) {
        responseResolutionHash[shortResolutionKey].u = resolutions[resolution].url;
      }
    }

    return responseResolutionHash;
  }

  /**
   * Format resolutions to update.
   *
   * @param {object} resolutions
   * @private
   */
  _formatResolutionsToUpdate(resolutions) {
    const oThis = this;

    const responseResolutionHash = {};
    for (const resolution in resolutions) {
      const shortResolutionKey = videoConstants.resolutionKeyToShortMap[resolution];
      responseResolutionHash[shortResolutionKey] = oThis._formatResolutionToInsert(resolutions[resolution]);
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
   * @param {number} [params.id]
   * @param {array<number>} [params.ids]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    const VideoByIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds');

    if (params.id) {
      promisesArray.push(new VideoByIds({ ids: [params.id] }).clear());
    }

    if (params.ids) {
      promisesArray.push(new VideoByIds({ ids: params.ids }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = Video;
