const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.userDbName;

/**
 * Class for invite code model.
 *
 * @class InviteCode
 */
class InviteCode extends ModelBase {
  /**
   * Constructor for invite code model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'invite_codes';
  }

  /**
   * List of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return ['id', 'code', 'inviteLimit', 'invitedUserCount', 'userId', 'inviterCodeId', 'createdAt', 'updatedAt'];
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.code
   * @param {number} dbRow.invite_limit
   * @param {number} dbRow.invited_user_count
   * @param {number} dbRow.user_id
   * @param {number} dbRow.inviter_code_id
   * @param {string} dbRow.created_at
   * @param {string} dbRow.updated_at
   *
   * @return {object}
   * @private
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      code: dbRow.code,
      inviteLimit: dbRow.invite_limit,
      invitedUserCount: dbRow.invited_user_count,
      userId: dbRow.user_id,
      inviterCodeId: dbRow.inviter_code_id,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch invite code by id.
   *
   * @param {integer} id
   *
   * @return {object}
   */
  async fetchById(id) {
    const oThis = this;

    const dbRows = await oThis.fetchByIds([id]);

    return dbRows[id] || {};
  }

  /**
   * Fetch invite code for given ids.
   *
   * @param {array} ids: invite code ids
   *
   * @return {object}
   */
  async fetchByIds(ids) {
    const oThis = this;

    const response = {};

    const dbRows = await oThis
      .select('*')
      .where(['id IN (?)', ids])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Fetch invite code by code.
   *
   * @param {string} code: code
   *
   * @return {object}
   */
  async fetchByCode(code) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where(['code = ?', code])
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.id
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.id) {
      const InviteCodeByIdCache = require(rootPrefix + '/lib/cacheManagement/single/InviteCodeById');
      promisesArray.push(new InviteCodeByIdCache({ id: params.id }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = InviteCode;
