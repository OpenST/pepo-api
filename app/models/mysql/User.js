const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

class UserModel extends ModelBase {
  /**
   * User model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'users';
  }

  /***
   * Bitwise Config
   *
   * @return {Object}
   */
  get bitwiseConfig() {
    return {
      properties: userConstants.properties
    };
  }

  /**
   *
   * @param dbRow
   * @return {object}
   */
  formatDbData(dbRow) {
    return {
      id: dbRow.id,
      userName: dbRow.user_name,
      firstName: dbRow.first_name,
      lastName: dbRow.last_name,
      password: dbRow.password,
      encryptionSalt: dbRow.encryption_salt,
      markInactiveTriggerCount: dbRow.mark_inactive_trigger_count,
      properties: dbRow.properties,
      status: userConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * List Of Formatted Column names that can be exposed by service
   *
   *
   * @returns {Array}
   */
  safeFormattedColumnNames() {
    return [
      'id',
      'userName',
      'firstName',
      'lastName',
      'markInactiveTriggerCount',
      'properties',
      'status',
      'createdAt',
      'updatedAt'
    ];
  }

  /***
   * Fetch user for id
   *
   * @param userName {String} - user name
   *
   * @return {Object}
   */
  async fetchByUserName(userName) {
    const oThis = this;
    let dbRows = await oThis
      .select(['id'])
      .where(['user_name = ?', userName])
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /***
   * Fetch secure user for id
   *
   * @param id {String} - id
   *
   * @return {Object}
   */
  async fetchById(id) {
    const oThis = this;

    let res = fetchByIds([id]);

    return res[id] || {};
  }

  /***
   * Fetch secure user for id
   *
   * @param ids {Array} - ids
   *
   * @return {Object}
   */
  async fetchByIds(ids) {
    const oThis = this;
    let dbRows = await oThis
      .select([
        'id',
        'user_name',
        'first_name',
        'last_name',
        'mark_inactive_trigger_count',
        'properties',
        'status',
        'created_at',
        'updated_at'
      ])
      .where({ id: ids })
      .fire();

    let response = {};

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /***
   * Fetch secure user for id
   *
   * @param id {Integer} - User Id
   *
   * @return {Object}
   */
  async fetchSecureById(id) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where(['id = ?', id])
      .fire();

    if (dbRows.length === 0) {
      return {};
    }
    return oThis.formatDbData(dbRows[0]);
  }

  /**
   * Fetch user ids
   *
   * @param {object} params
   * @param {Array} params.userId
   * @param {number} [params.page]
   * @param {number} [params.limit]
   *
   * @returns {Promise<*>}
   */
  async fetchPaginatedUsers(params) {
    const oThis = this;

    const page = params.page || 1,
      limit = params.limit || 10,
      offset = (page - 1) * limit;

    let dbRows = await oThis
      .select(['id'])
      .where(['status != ?', userConstants.invertedStatuses[userConstants.blockedStatus]])
      .limit(limit)
      .offset(offset)
      .order_by('first_name ASC')
      .fire();

    let response = [];

    for (let index = 0; index < dbRows.length; index++) {
      response.push(dbRows[index].id);
    }

    return response;
  }

  /**
   * Get Cookie Value For
   *
   * @param userObj
   * @param options
   * @returns {string}
   */
  getCookieValueFor(userObj, options) {
    const oThis = this;

    return userObj.id + ':' + options.timestamp + ':' + oThis.getCookieTokenFor(userObj, options);
  }

  /**
   * Get Cookie Token For
   *
   * @param userObj
   * @param options
   * @returns {String}
   */
  getCookieTokenFor(userObj, options) {
    let passwordEncrypted = userObj.password;
    let stringToSign =
      userObj.id +
      ':' +
      options.timestamp +
      ':' +
      coreConstants.PA_COOKIE_TOKEN_SECRET +
      ':' +
      passwordEncrypted.substring(0, 16);
    let salt =
      userObj.id +
      ':' +
      passwordEncrypted.slice(-16) +
      ':' +
      coreConstants.PA_COOKIE_TOKEN_SECRET +
      ':' +
      options.timestamp;
    let cookieToken = util.createSha256Digest(salt, stringToSign);
    return cookieToken;
  }

  /***
   * Flush cache
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser');

    await new SecureUserCache({
      id: params.id
    }).clear();

    const UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User');

    await new UserCache({
      ids: [params.id]
    }).clear();
  }
}

module.exports = UserModel;
