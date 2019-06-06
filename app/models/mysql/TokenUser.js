'use strict';
/**
 * @file - Model for token_users table
 */
const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

class TokenUserModel extends ModelBase {
  /**
   * TokenUser model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'token_users';
  }

  /***
   * Bitwise Config
   *
   * @return {Object}
   */
  get bitwiseConfig() {
    return {
      properties: tokenUserConstants.properties
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
      userId: dbRow.user_id,
      ostUserId: dbRow.ost_user_id,
      ostTokenHolderAddress: dbRow.ost_token_holder_address,
      scryptSalt: dbRow.scrypt_salt,
      encryptionSalt: dbRow.encryption_salt,
      properties: dbRow.properties,
      ostStatus: dbRow.ost_status,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /***
   * Fetch token user for user id
   *
   * @param id {Integer} - Token User Id
   *
   * @return {Object}
   */
  fetchByUserId(userId) {
    const oThis = this;
    let dbRows = oThis
      .select([
        'id',
        'user_id',
        'ost_user_id',
        'ost_token_holder_address',
        'properties',
        'ost_status',
        'created_at',
        'updated_at'
      ])
      .where(['user_id = ?', userId])
      .fire();

    if (dbRows.length === 0) {
      return {};
    }
    return oThis.formatDbData(dbRows[0]);
  }
}

module.exports = TokenUserModel;
