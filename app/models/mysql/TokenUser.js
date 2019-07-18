const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  database = require(rootPrefix + '/lib/globalConstant/database'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser');

const dbName = database.userDbName;

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
   * Format Secure Db data
   *
   * @param dbRow
   * @return {object}
   */
  formatSecureDbData(dbRow) {
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      ostUserId: dbRow.ost_user_id,
      ostTokenHolderAddress: dbRow.ost_token_holder_address,
      scryptSalt: dbRow.scrypt_salt,
      properties: dbRow.properties,
      ostStatus: tokenUserConstants.ostStatuses[dbRow.ost_status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Format Db data
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
      properties: dbRow.properties,
      ostStatus: tokenUserConstants.ostStatuses[dbRow.ost_status],
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
    return ['id', 'userId', 'ostUserId', 'ostTokenHolderAddress', 'properties', 'ostStatus', 'createdAt', 'updatedAt'];
  }

  /***
   * Fetch token user for given token user ids
   *
   * @param userIds {Array} - Token User Ids
   *
   * @return {Object}
   */
  async fetchByUserIds(userIds) {
    const oThis = this;
    let response = {};

    let dbRows = await oThis
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
      .where(['user_id IN (?)', userIds])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.userId] = formatDbRow;
    }

    return response;
  }

  /***
   * Fetch token user for ost user id
   *
   * @param ostUserId {String} - Ost User Id
   *
   * @return {Object}
   */
  async fetchByOstUserId(ostUserId) {
    const oThis = this;
    let dbRows = await oThis.fetchByOstUserIds([ostUserId]);

    return dbRows[ostUserId] || {};
  }

  /***
   * Fetch token user for ost user ids
   *
   * @param ostUserIds {Array} - Ost User Ids
   *
   * @return {Object}
   */
  async fetchByOstUserIds(ostUserIds) {
    const oThis = this;
    let response = {},
      dbRows = await oThis
        .select(['id', 'user_id', 'ost_user_id'])
        .where(['ost_user_id IN (?)', ostUserIds])
        .fire();

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRows = oThis.formatDbData(dbRows[index]);
      response[formatDbRows.ostUserId] = formatDbRows;
    }

    return response;
  }

  /***
   * Fetch secured data of user for id
   *
   * @param userId {Integer} - Token User Id
   *
   * @return {Object}
   */
  async fetchSecureByUserId(userId) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where(['user_id = ?', userId])
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatSecureDbData(dbRows[0]);
  }

  /***
   * Flush cache
   *
   * @param {object} params
   * @param {Integer} params.userId
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const SecureTokenUserByUserIdCache = require(rootPrefix + '/lib/cacheManagement/single/SecureTokenUserByUserId');
    await new SecureTokenUserByUserIdCache({
      userId: params.userId
    }).clear();

    const UserByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds');
    await new UserByIdCache({
      userIds: [params.userId]
    }).clear();

    if (params.ostUserId) {
      const TokenUserByOstUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByOstUserIds');

      await new TokenUserByOstUserIdsCache({
        ostUserIds: [params.ostUserId]
      }).clear();
    }
  }
}

module.exports = TokenUserModel;
