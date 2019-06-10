'use strict';
/**
 * @file - Model for users table
 */
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

  /***
   * Fetch user for id
   *
   * @param userName {Integer} - User Id
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
      .where(['id = ?', id])
      .fire();

    if (dbRows.length === 0) {
      return {};
    }
    return oThis.formatDbData(dbRows[0]);
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
    const SecureUserByIDCache = require(rootPrefix + '/lib/cacheManagement/SecureUserById');

    await new SecureUserByIDCache({
      id: params.id
    }).clear();

    const UserByIdCache = require(rootPrefix + '/lib/cacheManagement/UserById');

    await new UserByIdCache({
      id: params.id
    }).clear();
  }
}

module.exports = UserModel;
