const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  temporaryTokenConstant = require(rootPrefix + '/lib/globalConstant/temporaryToken');

// Declare variables.
const dbName = databaseConstants.bigDbName;

/**
 * Class for temporary token model.
 *
 * @class TemporaryToken
 */
class TemporaryToken extends ModelBase {
  /**
   * Constructor for temporary token model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'temporary_tokens';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.entity_id
   * @param {number} dbRow.kind
   * @param {string} dbRow.token
   * @param {number} dbRow.status
   * @param {number/string} dbRow.created_at
   * @param {number/string} dbRow.updated_at
   *
   * @returns {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      entityId: dbRow.entity_id,
      kind: temporaryTokenConstant.kinds[dbRow.kind],
      token: dbRow.token,
      status: temporaryTokenConstant.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List Of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return ['id', 'entityId', 'kind', 'token', 'status', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch temporary token by id.
   *
   * @param {string} id
   *
   * @return {object}
   */
  async fetchById(id) {
    const oThis = this;

    const res = await oThis.fetchByIds([id]);

    return res[id] || {};
  }

  /**
   * Fetch temporary token by ids.
   *
   * @param {array} ids
   *
   * @return {object}
   */
  async fetchByIds(ids) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ id: ids })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    // Do nothing.
  }
}

module.exports = TemporaryToken;
