const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin/admin'),
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
   * @param {string} dbRow.slack_id
   * @param {string} dbRow.encryption_salt
   * @param {number} dbRow.status
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @returns {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      name: dbRow.name,
      email: dbRow.email,
      password: dbRow.password,
      slackId: dbRow.slack_id,
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
   * @param {string/number} id
   *
   * @returns {Promise<object>}
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
   * @returns {Promise<object>}
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
   * Fetch secure user by ids.
   *
   * @param {string} slackId
   *
   * @returns {Promise<object>}
   */
  async fetchBySlackId(slackId) {
    const oThis = this;

    const dbRows = await oThis
      .select('id')
      .where({
        slack_id: slackId,
        status: adminConstants.invertedStatuses[adminConstants.activeStatus]
      })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
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
   * @param {number} adminObj.id
   * @param {string} adminObj.password
   * @param {object} options
   * @param {number} options.timestamp
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
   * @param {number} adminObj.id
   * @param {string} adminObj.password
   * @param {object} options
   * @param {number} options.timestamp
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
   * Cookie token for admin.
   *
   * @param {object} adminObj
   * @param {number} adminObj.id
   * @param {string} adminObj.password
   *
   * @returns {*}
   */
  cookieToken(adminObj) {
    return util.createMd5Digest('ct-' + adminObj.id + '-' + adminObj.password);
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} [params.id]
   * @param {string} [params.email]
   * @param {number} [params.slackId]
   *
   * @returns {Promise<void>}
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

    if (params.slackId) {
      const AdminBySlackIdCache = require(rootPrefix + '/lib/cacheManagement/single/AdminBySlackId');
      promisesArray.push(new AdminBySlackIdCache({ slackId: params.slackId }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = AdminModel;
