const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  dynamicVariablesConstants = require(rootPrefix + '/lib/globalConstant/dynamicVariables');

// Declare variables.
const dbName = databaseConstants.bigDbName;

/**
 * Class for dynamic global constants model.
 *
 * @class DynamicVariables
 */
class DynamicVariables extends ModelBase {
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

    oThis.tableName = 'dynamic_variables';
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
      kind: dynamicVariablesConstants.kinds[dbRow.kind],
      value: dbRow.value,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Get value for given constant kind.
   *
   * @param {array} kinds
   *
   * @returns {Promise<{}>}
   */
  async getForKinds(kinds) {
    const oThis = this;

    const constantKindIntArray = [];
    for (let index = 0; index < kinds.length; index++) {
      constantKindIntArray.push(dynamicVariablesConstants.invertedKinds[kinds[index]]);
    }

    const dbRows = await oThis
      .select('*')
      .where({ kind: constantKindIntArray })
      .fire();

    const responseData = {};
    for (let index = 0; index < dbRows.length; index++) {
      const formattedRow = oThis.formatDbData(dbRows[index]);
      responseData[formattedRow.kind] = formattedRow;
    }

    return responseData;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {string} params.kind
   * @param {string} params.kinds
   *
   * @returns {Promise<void>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.kind) {
      const DynamicVariablesByKindCache = require(rootPrefix + '/lib/cacheManagement/multi/DynamicVariablesByKind');
      promisesArray.push(new DynamicVariablesByKindCache({ kinds: [params.kind] }).clear());
    }

    if (params.kinds) {
      const DynamicVariablesByKindCache = require(rootPrefix + '/lib/cacheManagement/multi/DynamicVariablesByKind');
      promisesArray.push(new DynamicVariablesByKindCache({ kinds: params.kinds }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = DynamicVariables;
