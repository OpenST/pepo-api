const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  dynamicGlobalConstantsConsts = require(rootPrefix + '/lib/globalConstant/dynamicGlobalConstants');

// Declare variables.
const dbName = databaseConstants.entityDbName;

/**
 * Class for dynamic global constants model.
 *
 * @class DynamicGlobalConstants
 */
class DynamicGlobalConstants extends ModelBase {
  /**
   * Constructor for curated entity model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'dynamic_global_constants';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.kind
   * @param {string} dbRow.value
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      kind: dynamicGlobalConstantsConsts.kinds(dbRow.kind),
      value: dbRow.value,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Get value for given constant kind.
   *
   * @param {string} kind
   *
   * @returns {Promise<{}>}
   */
  async getForKind(kind) {
    const oThis = this;

    const constantKindInt = dynamicGlobalConstantsConsts.invertedKinds[kind];

    if (!constantKindInt) {
      return Promise.reject(new Error('Invalid constant kind.'));
    }

    const dbRows = await oThis
      .select('*')
      .where({ kind: constantKindInt })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /**
   * Get value for given constant kind.
   *
   * @param {Array} Kinds
   *
   * @returns {Promise<{}>}
   */
  async getForKinds(kinds) {
    const oThis = this;

    let constantKindIntArray = [];
    for (let i = 0; i < kinds.length; i++) {
      constantKindIntArray.push(dynamicGlobalConstantsConsts.invertedKinds[kinds[i]]);
    }

    const dbRows = await oThis
      .select('*')
      .where({ kind: constantKindIntArray })
      .fire();

    let responseData = {};
    for (let index = 0; index < dbRows.length; index++) {
      responseData[dynamicGlobalConstantsConsts.kinds[dbRows[index].kind]] = dbRows[index].value;
    }

    return responseData;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {string} params.kind
   *
   * @returns {Promise<void>}
   */
  static async flushCache(params) {}
}

module.exports = DynamicGlobalConstants;
