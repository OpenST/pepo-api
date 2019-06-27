const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants');
const dbName = 'pepo_api_' + coreConstants.environment;

/**
 * Class for profile url model.
 *
 * @class
 */
class profileUrls extends ModelBase {
  /**
   * profile url model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'profile_urls';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.url
   * @param {string} dbRow.kind
   * @param {string} dbRow.created_at
   * @param {string} dbRow.updated_at
   *
   * @return {object}
   * @private
   */
  _formatDbData(dbRow) {
    return {
      id: dbRow.id,
      url: dbRow.url,
      kind: dbRow.kind,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /***
   * Fetch profile url by id
   *
   * @param id {Integer} - id
   *
   * @return {Object}
   */
  async fetchById(id) {
    const oThis = this;
    let dbRows = await oThis.fetchByIds([id]);

    return dbRows[id] || {};
  }

  /***
   * Fetch profile url for given ids
   *
   * @param Ids {Array} - Profile Text Ids
   *
   * @return {Object}
   */
  async fetchByIds(Ids) {
    const oThis = this;
    let response = {};

    let dbRows = await oThis
      .select('*')
      .where(['id IN (?)', Ids])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }
}

module.exports = profileUrls;
