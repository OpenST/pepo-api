const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser');

// Declare variables.
const dbName = databaseConstants.userDbName;

/**
 * Class for token user model.
 *
 * @class TokenUserModel
 */
class TokenUserModel extends ModelBase {
  /**
   * Constructor for token user model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'token_users';
  }

  /**
   * Bitwise config.
   *
   * @return {object}
   */
  get bitwiseConfig() {
    return {
      properties: tokenUserConstants.properties
    };
  }

  /**
   * Format secure Db data.
   *
   * @param {object} dbRow
   * @param {string} dbRow.id
   * @param {string} dbRow.user_id
   * @param {string} dbRow.ost_user_id
   * @param {string} dbRow.ost_token_holder_address
   * @param {string} dbRow.scrypt_salt
   * @param {array<string>} dbRow.properties
   * @param {number} dbRow.ost_status
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatSecureDbData(dbRow) {
    const oThis = this;

    const formattedData = {
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

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {string} dbRow.user_id
   * @param {string} dbRow.ost_user_id
   * @param {string} dbRow.ost_token_holder_address
   * @param {array<string>} dbRow.properties
   * @param {number} dbRow.ost_status
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
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
   * List Of formatted Column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return ['id', 'userId', 'ostUserId', 'ostTokenHolderAddress', 'properties', 'ostStatus', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch token user for given token user ids
   *
   * @param {array} userIds: token user ids
   *
   * @return {object}
   */
  async fetchByUserIds(userIds) {
    const oThis = this;

    const response = {};

    const dbRows = await oThis
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
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.userId] = formatDbRow;
    }

    return response;
  }

  /**
   * Fetch token user for ost user id
   *
   * @param {string} ostUserId
   *
   * @return {object}
   */
  async fetchByOstUserId(ostUserId) {
    const oThis = this;

    const dbRows = await oThis.fetchByOstUserIds([ostUserId]);

    return dbRows[ostUserId] || {};
  }

  /**
   * Fetch token user for ost user ids.
   *
   * @param {array} ostUserIds
   *
   * @return {object}
   */
  async fetchByOstUserIds(ostUserIds) {
    const oThis = this;

    const response = {},
      dbRows = await oThis
        .select(['id', 'user_id', 'ost_user_id'])
        .where(['ost_user_id IN (?)', ostUserIds])
        .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRows = oThis.formatDbData(dbRows[index]);
      response[formatDbRows.ostUserId] = formatDbRows;
    }

    return response;
  }

  /**
   * Fetch secured data of user for id
   *
   * @param {integer} userId: token user id
   *
   * @return {object}
   */
  async fetchSecureByUserId(userId) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where(['user_id = ?', userId])
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatSecureDbData(dbRows[0]);
  }

  /**
   * Flush cache
   *
   * @param {object} params
   * @param {string} params.userId
   * @param {string} [params.ostUserId]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    const SecureTokenUserByUserIdCache = require(rootPrefix + '/lib/cacheManagement/single/SecureTokenUserByUserId');
    promisesArray.push(new SecureTokenUserByUserIdCache({ userId: params.userId }).clear());

    const UserByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds');
    promisesArray.push(new UserByIdCache({ userIds: [params.userId] }).clear());

    if (params.ostUserId) {
      const TokenUserByOstUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByOstUserIds');
      promisesArray.push(new TokenUserByOstUserIdsCache({ ostUserIds: [params.ostUserId] }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = TokenUserModel;
