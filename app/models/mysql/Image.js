const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  util = require(rootPrefix + '/lib/util'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  imageConst = require(rootPrefix + '/lib/globalConstant/image'),
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
   * @param {string} dbRow.resolutions
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
      status: imageConst.statuses[dbRow.status],
      kind: imageConst.kinds[dbRow.kind],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Format resolutions hash
   *
   * @param resolution
   * @returns {Object}
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
   * Formats the complete resolution hash
   *
   * @param resolutions
   * @param urlTemplate
   * @private
   */
  _formatResolutions(resolutions, urlTemplate) {
    const oThis = this;

    let responseResolutionHash = {};
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
   * Fetch image by id
   *
   * @param {number} id
   *
   * @return {object}
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
   * @param {number} params.userId
   * @param {number} params.kind
   * @param {number} params.status
   *
   * @return {object}
   */
  async insertImage(params) {
    const oThis = this;

    let fileExtension = util.getFileExtension(params.resolutions.original.url),
      urlTemplate =
        s3Constants.imageShortUrlPrefix +
        '/' +
        util.getS3FileTemplatePrefix(params.userId) +
        s3Constants.fileNameShortSizeSuffix +
        fileExtension,
      resolutions = oThis._formatResolutionsToInsert(params.resolutions);

    return oThis
      .insert({
        url_template: urlTemplate,
        resolutions: JSON.stringify(resolutions),
        kind: imageConst.invertedKinds[params.kind],
        status: imageConst.invertedStatuses[params.status]
      })
      .fire();
  }

  /**
   * Insert into images.
   *
   * @param {object} params
   * @param {string} params.resolutions
   * @param {number} params.status
   * @param {number} params.id
   *
   * @return {object}
   */
  async updateImage(params) {
    const oThis = this;

    let resolutions = oThis._formatResolutionsToInsert(params.resolutions);

    return oThis
      .update({
        resolutions: JSON.stringify(resolutions),
        status: imageConst.invertedStatuses[params.status]
      })
      .where({ id: params.id })
      .fire();
  }

  /**
   * Format resolutions to insert
   *
   * @param resolutions
   * @private
   */
  _formatResolutionsToInsert(resolutions) {
    const oThis = this;

    let responseResolutionHash = {};
    for (const resolution in resolutions) {
      if (resolution === 'original') {
        responseResolutionHash['o'] = oThis._formatResolutionToInsert(resolutions[resolution]);
        responseResolutionHash['o'].u = resolutions[resolution].url;
      } else {
        responseResolutionHash[resolution] = oThis._formatResolutionToInsert(resolutions[resolution]);
      }
    }
    return responseResolutionHash;
  }

  /**
   * Format resolution to insert
   *
   * @param resolution
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
      .where({
        id: params.id
      })
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

    await new ImageByIds({
      ids: [params.id]
    }).clear();
  }
}

module.exports = Image;
