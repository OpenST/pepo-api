const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  videoConst = require(rootPrefix + '/lib/globalConstant/video');

const dbName = 'pepo_api_' + coreConstants.environment;

/**
 * Class for video model.
 *
 * @class
 */
class Video extends ModelBase {
  /**
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
    return {
      id: dbRow.id,
      resolutions: JSON.parse(dbRow.resolutions),
      posterImageId: dbRow.poster_image_id,
      status: videoConst.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Fetch video by id
   *
   * @param id {integer} - id
   *
   * @return {object}
   */
  async fetchById(id) {
    const oThis = this;

    let dbRows = await oThis.fetchByIds([id]);

    return dbRows[id] || {};
  }

  /**
   * Fetch videos for given ids
   *
   * @param ids {array} - image ids
   *
   * @return {object}
   */
  async fetchByIds(ids) {
    const oThis = this;
    let response = {};

    let dbRows = await oThis
      .select('*')
      .where(['id IN (?)', ids])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis._formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Insert into videos
   *
   * @param params {object} - params
   *
   * @return {object}
   */
  async insertVideo(params) {
    const oThis = this;

    let response = await oThis
      .insert({
        resolutions: JSON.stringify(params.resolutions),
        poster_image_id: params.posterImageId,
        status: videoConst.invertedStatuses[params.status]
      })
      .fire();

    return response;
  }

  /**
   * Update image by id
   *
   * @param params
   * @return {Promise<void>}
   */
  async updateById(params) {
    const oThis = this;

    let response = await oThis
      .update({
        resolutions: JSON.stringify(params.resolutions),
        status: videoConst.invertedStatuses[params.status],
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

    await new VideoByIds({
      ids: [params.id]
    }).clear();
  }
}

module.exports = Video;
