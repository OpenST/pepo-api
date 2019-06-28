const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  profileUrlConstant = require(rootPrefix + '/lib/globalConstant/profileUrl');

const dbName = 'pepo_api_' + coreConstants.environment;

/**
 * Class for profile url model.
 *
 * @class
 */
class ProfileUrl extends ModelBase {
  /**
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
   * @param {number} dbRow.kind
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
      kind: profileUrlConstant.kinds[dbRow.kind],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Fetch profile url by id
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
   * Fetch profile url for given ids
   *
   * @param ids {array} - Profile Text ids
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
   * Insert into profile urls
   *
   * @param params {object} - params
   *
   * @return {object}
   */
  async insertProfileUrl(params) {
    const oThis = this;

    let response = await oThis
      .insert({
        url: params.url,
        kind: profileUrlConstant.invertedKinds[params.kind]
      })
      .fire();

    return response.data;
  }
}

module.exports = ProfileUrl;
