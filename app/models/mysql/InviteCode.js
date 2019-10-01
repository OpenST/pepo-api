const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

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
    return [
      'id',
      'code',
      'kind',
      'inviteLimit',
      'invitedUserCount',
      'userId',
      'inviterCodeId',
      'createdAt',
      'updatedAt'
    ];
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.code
   * @param {string} dbRow.kind
   * @param {number} dbRow.invite_limit
   * @param {number} dbRow.invited_user_count
   * @param {number} dbRow.user_id
   * @param {number} dbRow.inviter_code_id
   * @param {string} dbRow.created_at
   * @param {string} dbRow.updated_at
   *
   * @returns {object}
   * @private
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      code: dbRow.code,
      kind: inviteCodeConstants.kinds[dbRow.kind],
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
   * @returns {object}
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
   * @returns {object}
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
   * Fetch invite codes for given codes.
   *
   * @param {array} codes: invite codes
   *
   * @returns {object}
   */
  async fetchByInviteCodes(codes) {
    const oThis = this;

    const response = {};

    const dbRows = await oThis
      .select('*')
      .where(['code IN (?)', codes])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.code] = formatDbRow;
    }

    return response;
  }

  /**
   * Update invited user count.
   *
   * @returns {Promise<void>}
   * @private
   */
  async updateInvitedUserCount(id) {
    const oThis = this;

    await oThis
      .update('invited_user_count = invited_user_count + 1')
      .where({ id: id })
      .fire();
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
   * @returns {Promise<object>}
   */
  async getUserIdsByInviterUserId(params) {
    const oThis = this;

    const limit = params.limit,
      inviterCodeId = params.inviterCodeId,
      paginationId = params.paginationId;

    const queryObject = oThis
      .select('id, user_id')
      .where({ inviter_code_id: inviterCodeId })
      .limit(limit)
      .order_by('id desc');

    if (paginationId) {
      queryObject.where(['id < ?', paginationId]);
    }

    const dbRows = await queryObject.fire();

    const userIds = [];
    let nextPaginationId = null;

    for (let index = 0; index < dbRows.length; index++) {
      if (dbRows[index].user_id) {
        userIds.push(dbRows[index].user_id);
        nextPaginationId = dbRows[index].id;
      }
    }

    return { userIds: userIds, nextPaginationId: nextPaginationId };
  }

  /**
   * Create invite code
   *
   * @param insertData
   * @returns {Promise<*>}
   * @private
   */
  async _insert(insertData) {
    const oThis = this;

    let retryCount = 3,
      caughtInException = true,
      insertResponse = null;

    while (retryCount > 0 && caughtInException) {
      // Insert invite code in database.
      retryCount--;
      caughtInException = false;

      insertResponse = await new InviteCode()
        .insert(insertData)
        .fire()
        .catch(function(err) {
          logger.log('Error while inserting invite_codes data: ', err);
          if (InviteCode.isDuplicateIndexViolation(InviteCode.inviteCodeUniqueIndexName, err)) {
            logger.log('Invite code conflict. Attempting with a modified invite code.');
            caughtInException = true;
            insertData.code = inviteCodeConstants.generateInviteCode;
            return null;
          } else {
            return Promise.reject(err);
          }
        });
    }

    if (!insertResponse) {
      logger.error('Error while inserting data in invite_codes table.');
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_m_m_ic_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            insertData: insertData
          }
        })
      );
    }

    return responseHelper.successWithData(insertResponse);
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} [params.userId]
   * @param {string} [params.code]
   * @param {string/number} [params.id]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promises = [];

    if (params.userId) {
      const InviteCodeByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/InviteCodeByUserIds');
      promises.push(new InviteCodeByUserIdsCache({ userIds: [params.userId] }).clear());
    }

    if (params.code) {
      const InviteCodeByCodeCache = require(rootPrefix + '/lib/cacheManagement/single/InviteCodeByCode');
      promises.push(new InviteCodeByCodeCache({ inviteCode: params.code }).clear());
    }

    if (params.id) {
      const InviteCodeByIdCache = require(rootPrefix + '/lib/cacheManagement/single/InviteCodeById');
      promises.push(new InviteCodeByIdCache({ id: params.id }).clear());
    }

    await Promise.all(promises);
  }

  /**
   * Get inviteCode unique index name.
   *
   * @returns {string}
   */
  static get inviteCodeUniqueIndexName() {
    return 'idx_2';
  }
}

module.exports = InviteCode;
