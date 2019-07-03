const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  imageConst = require(rootPrefix + '/lib/globalConstant/image');

const dbName = 'pepo_api_' + coreConstants.environment;

/**
 * Class for image model.
 *
 * @class
 */
class Image extends ModelBase {
  /**
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
    return {
      id: dbRow.id,
      resolutions: dbRow.resolutions,
      status: imageConst.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Fetch image by id
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
   * Fetch images for given ids
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
   * Insert into images
   *
   * @param params {object} - params
   *
   * @return {object}
   */
  async insertImage(params) {
    const oThis = this;

    let response = await oThis
      .insert({
        resolutions: params.resolutions,
        status: imageConst.invertedStatuses[params.status]
      })
      .fire();

    return response.data;
  }
}

module.exports = Image;
