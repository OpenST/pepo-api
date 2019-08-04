const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  userLoginConstants = require(rootPrefix + '/lib/globalConstant/userLogin');

// Declare variables.
const dbName = databaseConstants.userDbName;

/**
 * Class for user login model.
 *
 * @class UserLogin
 */
class UserLogin extends ModelBase {
  /**
   * Constructor for user login model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_logins';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.user_id
   * @param {number} dbRow.service
   * @param {string} dbRow.service_unique_id
   * @param {number} dbRow.properties
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
      service: dbRow.service,
      serviceUniqueId: dbRow.service_unique_id,
      properties: dbRow.properties,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Get user id by service and service unique id.
   *
   * @param {string} service
   * @param {string} serviceUniqueId
   *
   * @returns {Promise<*>}
   */
  async getUserIdByServiceAndServiceUniqueId(service, serviceUniqueId) {
    const oThis = this;

    const dbRows = await oThis
      .select('user_id')
      .where({
        service: userLoginConstants.invertedServiceTypes[service],
        service_unique_id: serviceUniqueId
      })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return { userId: dbRows[0].user_id };
  }
}

module.exports = UserLogin;
