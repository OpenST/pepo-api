const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.entityDbName;

/**
 * Class for image model.
 *
 * @class Image
 */
class Image extends ModelBase {
  /**
   * Constructor for image model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'images';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.url_template
   * @param {string} dbRow.resolutions
   * @param {number} dbRow.status
   * @param {number} dbRow.resize_status
   * @param {number} dbRow.kind
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
      urlTemplate: dbRow.url_template,
      resolutions: JSON.parse(dbRow.resolutions),
      status: imageConstants.statuses[dbRow.status],
      resizeStatus: imageConstants.resizeStatuses[dbRow.resize_status],
      kind: imageConstants.kinds[dbRow.kind],
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
        responseResolution = imageConstants.originalResolution;
        responseResolutionHash[responseResolution] = oThis._formatResolution(resolutions[resolution]);
        /*
        If url is already present in original resolution hash. Then the same url is set in original resolutions hash
        else we make the original url from url template.
         */
        if (responseResolutionHash[responseResolution].url) {
          responseResolutionHash[responseResolution].url = shortToLongUrl.getFullUrl(
            responseResolutionHash[responseResolution].url
          );
        } else {
          responseResolutionHash[responseResolution].url = shortToLongUrl.getFullUrl(urlTemplate, responseResolution);
        }
      } else {
        responseResolutionHash[responseResolution] = oThis._formatResolution(resolutions[resolution]);
        responseResolutionHash[responseResolution].url = shortToLongUrl.getFullUrl(urlTemplate, responseResolution);
      }
    }

    return responseResolutionHash;
  }

  /**
   * Fetch image by id
   *
   * @param {number} id
   *
   * @returns {object}
   */
  async fetchById(id) {
    const oThis = this;

    const dbRows = await oThis.fetchByIds([id]);

    return dbRows[id] || {};
  }

  /**
   * Fetch images for given ids
   *
   * @param {array} ids: image ids
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
   * Insert into images.
   *
   * @param {object} params
   * @param {string} params.resolutions
   * @param {number} params.kind
   * @param {string} params.resizeStatus
   *
   * @returns {object}
   */
  async insertImage(params) {
    const oThis = this;

    const resolutions = oThis._formatResolutionsToInsert(params.resolutions);

    return oThis
      .insert({
        resolutions: JSON.stringify(resolutions),
        kind: imageConstants.invertedKinds[params.kind],
        status: imageConstants.invertedStatuses[imageConstants.activeStatus],
        resize_status: imageConstants.invertedResizeStatuses[params.resizeStatus]
      })
      .fire();
  }

  /**
   * Insert into images.
   *
   * @param {object} params
   * @param {string} params.urlTemplate
   * @param {string} params.resolutions
   * @param {string} params.resizeStatus
   * @param {number} params.id
   * @param {number} params.userId
   *
   * @returns {object}
   */
  async updateImage(params) {
    const oThis = this;

    // If twitter url needs to be shorten.
    if (params.resolutions.original && imageConstants.isFromExternalSource(params.resolutions.original.url)) {
      const imageLib = require(rootPrefix + '/lib/imageLib');
      const shortenedUrl = imageLib.shortenUrl({
        imageUrl: params.resolutions.original.url,
        isExternalUrl: true,
        userId: params.userId
      });
      if (shortenedUrl.isFailure()) {
        return Promise.reject(responseHelper.error(shortenedUrl));
      }
      params.resolutions.original.url = shortenedUrl.data.shortUrl;
    }

    const resolutions = oThis._formatResolutionsToUpdate(params.resolutions);

    return oThis
      .update({
        url_template: params.urlTemplate,
        resolutions: JSON.stringify(resolutions),
        resize_status: imageConstants.invertedResizeStatuses[params.resizeStatus]
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
      // While inserting original url has to be present in original resolutions hash only.
      if (resolution === imageConstants.originalResolution) {
        responseResolutionHash.o = oThis._formatResolutionToInsert(resolutions[resolution]);
        responseResolutionHash.o.u = resolutions[resolution].url;
      } else {
        responseResolutionHash[resolution] = oThis._formatResolutionToInsert(resolutions[resolution]);
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
      if (resolution === imageConstants.originalResolution) {
        if (imageConstants.isFromExternalSource(resolutions[resolution].url)) {
          // If the url is twitter url then url is to be stored in resolutions hash.
          responseResolutionHash.o = oThis._formatResolutionToInsert(resolutions[resolution]);
          responseResolutionHash.o.u = resolutions[resolution].url;
        } else {
          responseResolutionHash.o = oThis._formatResolutionToInsert(resolutions[resolution]);
        }
      } else {
        responseResolutionHash[resolution] = oThis._formatResolutionToInsert(resolutions[resolution]);
      }
    }

    return responseResolutionHash;
  }

  /**
   * Format resolution to insert
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
   * Delete by id.
   *
   * @param {object} params
   * @param {number} params.id
   *
   * @return {Promise<void>}
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
   * @param {number} params.id
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const ImageByIds = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds');

    await new ImageByIds({ ids: [params.id] }).clear();
  }
}

module.exports = Image;
