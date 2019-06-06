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

  /***
   * Fetch user for id
   *
   * @param id {Integer} - User Id
   *
   * @return {Object}
   */
  fetchByUserName(userName) {
    const oThis = this;
    return oThis
      .select([
        'id',
        'user_name',
        'password',
        'encryption_salt',
        'mark_inactive_trigger_count',
        'properties',
        'status',
        'created_at',
        'updated_at'
      ])
      .where({ user_name: userName })
      .fire();
  }
}

module.exports = UserModel;
