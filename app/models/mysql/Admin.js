const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables names.
const dbName = databaseConstants.adminDbName;

/**
 * Class for admin model.
 *
 * @class AdminModel
 */
class AdminModel extends ModelBase {
  /**
   * Constructor for admin model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'admins';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {string} dbRow.id
   * @param {string} dbRow.name
   * @param {string} dbRow.email
   * @param {string} dbRow.password
   * @param {string} dbRow.encryption_salt
   * @param {number} dbRow.status
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      name: dbRow.name,
      email: dbRow.email,
      password: dbRow.password,
      encryptionSalt: dbRow.encryption_salt,
      status: adminConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return ['id', 'name', 'email', 'status', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch secure user by id.
   *
   * @param {string} id
   *
   * @return {object}
   */
  async fetchById(id) {
    const oThis = this;

    const res = await oThis.fetchByIds([id]);

    return res || {};
  }

  /**
   * Fetch secure user by ids.
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
   * Fetch admin by email.
   *
   * @param {string} email
   *
   * @returns {Promise<object>}
   */
  async fetchByEmail(email) {
    const oThis = this;

    const dbRows = await oThis
      .select('id, email')
      .where({ email: email })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.email] = formatDbRow;
    }

    return response;
  }

  /**
   * Get cookie value.
   *
   * @param {object} adminObj
   * @param {object} options
   *
   * @returns {string}
   */
  getCookieValueFor(adminObj, options) {
    const oThis = this;

    return adminObj.id + ':' + options.timestamp + ':' + oThis.getCookieTokenFor(adminObj, options);
  }

  /**
   * Get cookie token.
   *
   * @param {object} adminObj
   * @param {object} options
   *
   * @returns {string}
   */
  getCookieTokenFor(adminObj, options) {
    const oThis = this;

    const uniqueStr = oThis.cookieToken(adminObj);

    const stringToSign =
      adminObj.id +
      ':' +
      options.timestamp +
      ':' +
      coreConstants.PA_COOKIE_TOKEN_SECRET +
      ':' +
      uniqueStr.substring(0, 16);
    const salt =
      adminObj.id + ':' + uniqueStr.slice(-16) + ':' + coreConstants.PA_COOKIE_TOKEN_SECRET + ':' + options.timestamp;

    return util.createSha256Digest(salt, stringToSign);
  }

  /**
   * Cookie token for admin
   *
   * @param adminObj
   * @returns {*}
   */
  cookieToken(adminObj) {
    return util.createMd5Digest('ct-' + adminObj.id + '-' + adminObj.password);
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.id
   * @param {string} params.email
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.id) {
      const AdminByIdCache = require(rootPrefix + '/lib/cacheManagement/single/AdminById');
      promisesArray.push(new AdminByIdCache({ id: params.id }).clear());
    }

    if (params.email) {
      const AdminByEmailsCache = require(rootPrefix + '/lib/cacheManagement/multi/AdminByEmails');
      promisesArray.push(new AdminByEmailsCache({ emails: [params.email] }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = AdminModel;
