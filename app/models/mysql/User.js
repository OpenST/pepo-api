'use strict';
/**
 * @file - Model for users table
 */
const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
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
   * @param id {Integer} - User Id
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
   * @param id {Integer} - User Id
   *
   * @return {Object}
   */
  async fetchById(id) {
    const oThis = this;
    let dbRows = await oThis
      .select(['id', 'user_name', 'mark_inactive_trigger_count', 'properties', 'status', 'created_at', 'updated_at'])
      .where(['id = ?', userId])
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

  getLoginCookieValue(userId, timestamp) {
    return '1:123:abcd';
  }

  getCookieValueFor(userObj, options) {
    return '1:123:abcd';
  }
}

module.exports = UserModel;
