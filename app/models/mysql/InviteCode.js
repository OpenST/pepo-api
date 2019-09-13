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
   * Fetch invite code for given user ids.
   *
   * @param {array<number>} userIds
   *
   * @returns {object}
   */
  async fetchByUserIds(userIds) {
    const oThis = this;

    const response = {};

    const dbRows = await oThis
      .select('*')
      .where(['user_id IN (?)', userIds])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.userId] = formatDbRow;
    }

    return response;
  }

  /**
   * Invited user search.
   *
   * @param {number} params.limit: limit
   * @param {number} params.inviterCodeId: inviterCodeId
   * @param {number} params.paginationId: pagination time stamp
   *
   * @return {Promise<array>}
   */
  async search(params) {
    const oThis = this;

    const limit = params.limit,
      inviterCodeId = params.inviterCodeId,
      paginationId = params.paginationId;

    const queryObject = oThis
      .select('user_id')
      .where({ inviter_code_id: inviterCodeId })
      .limit(limit)
      .order_by('id desc');

    if (paginationId) {
      queryObject.where(['id < ?', paginationId]);
    }

    const dbRows = await queryObject.fire();

    const userIds = [];

    for (let index = 0; index < dbRows.length; index++) {
      userIds.push(dbRows[index].user_id);
    }

    return userIds;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.userId
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    if (params.userId) {
      const InviteCodeByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/InviteCodeByUserIds');
      await new InviteCodeByUserIdsCache({ userIds: [params.userId] }).clear();
    }
  }
}

module.exports = InviteCode;
