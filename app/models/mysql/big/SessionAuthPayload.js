const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  sessionAuthPayloadConstants = require(rootPrefix + '/lib/globalConstant/big/sessionAuthPayload');

// Declare variables.
const dbName = databaseConstants.bigDbName;

/**
 * Class for Session Auth Payload model.
 *
 * @class SessionAuthPayloadModel
 */
class SessionAuthPayloadModel extends ModelBase {
  /**
   * Constructor for Session Auth Payload model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'session_auth_payloads';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.user_id
   * @param {string} dbRow.payload
   * @param {string} dbRow.status
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      userId: dbRow.user_id,
      payload: dbRow.payload,
      status: sessionAuthPayloadConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Get rows for given ids.
   *
   * @param {array} ids
   *
   * @returns {Promise<{}>}
   */
  async fetchByIds(ids) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ id: ids })
      .fire();

    const responseData = {};
    for (let index = 0; index < dbRows.length; index++) {
      const formattedRow = oThis.formatDbData(dbRows[index]);
      responseData[formattedRow.id] = formattedRow;
    }

    return responseData;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {string} params.id
   *
   * @returns {Promise<void>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.id) {
      const sessionAuthPayloadCache = require(rootPrefix + '/lib/cacheManagement/multi/SessionAuthPayload');
      promisesArray.push(new sessionAuthPayloadCache({ ids: [params.id] }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = SessionAuthPayloadModel;
