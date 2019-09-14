const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.entityDbName;

/**
 * Class for locations model.
 *
 * @class LocationModel
 */
class LocationModel extends ModelBase {
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

    oThis.tableName = 'locations';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.gmt_offset
   * @param {string} dbRow.time_zone
   * @param {string} dbRow.created_at
   * @param {string} dbRow.updated_at
   *
   * @returns {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      gmtOffset: dbRow.gmt_offset,
      timeZone: dbRow.time_zone,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch details.
   *
   * @returns {Promise<void>}
   */
  async fetchLocationIdsAndOffsets() {
    const oThis = this;

    const dbRows = await oThis.select('*').fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);

      response[formatDbRow.gmtOffset] = response[formatDbRow.gmtOffset] || [];
      response[formatDbRow.gmtOffset].push(formatDbRow.id);
    }

    return response;
  }

  /**
   *
   * @param ids
   * @returns {Promise<Object>}
   */
  async fetchByIds(ids) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({
        id: ids
      })
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);

      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   *
   * @param timezone
   * @returns {Promise<Object>}
   */
  async fetchByTimeZone(timezone) {
    const oThis = this,
      response = {};

    const dbRow = await oThis
      .select('*')
      .where({
        time_zone: timezone
      })
      .fire();

    response[timezone] = oThis.formatDbData(dbRow[0]);

    return response;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.id
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {}
}

module.exports = LocationModel;
