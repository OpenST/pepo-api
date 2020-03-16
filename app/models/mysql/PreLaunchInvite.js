const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite');

// Declare variables.
const dbName = databaseConstants.userDbName;

/**
 * Class for pre launch invite model.
 *
 * @class PreLaunchInvite
 */
class PreLaunchInvite extends ModelBase {
  /**
   * Constructor for pre launch invite model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'pre_launch_invites';
  }

  /**
   * List of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return [
      'id',
      'twitterId',
      'handle',
      'email',
      'name',
      'profileImageUrl',
      'creatorStatus',
      'status',
      'adminStatus',
      'inviterUserId',
      'inviteCode',
      'inviterCodeId',
      'inviteCodeId',
      'invitedUserCount',
      'createdAt',
      'updatedAt'
    ];
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.encryption_salt
   * @param {number} dbRow.twitter_id
   * @param {number} dbRow.handle
   * @param {string} dbRow.email
   * @param {string} dbRow.name
   * @param {string} dbRow.profile_image_url
   * @param {string} dbRow.creator_status
   * @param {string} dbRow.token
   * @param {string} dbRow.secret
   * @param {number} dbRow.status
   * @param {number} dbRow.admin_status
   * @param {number} dbRow.inviter_user_id
   * @param {string} dbRow.invite_code
   * @param {number} dbRow.inviter_code_id
   * @param {number} dbRow.invite_code_id
   * @param {number} dbRow.invited_user_count
   * @param {number/string} dbRow.created_at
   * @param {number/string} dbRow.updated_at
   *
   * @returns {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      encryptionSalt: dbRow.encryption_salt,
      twitterId: dbRow.twitter_id,
      handle: dbRow.handle,
      email: dbRow.email,
      name: dbRow.name,
      profileImageUrl: dbRow.profile_image_url,
      creatorStatus: preLaunchInviteConstants.creatorStatuses[dbRow.creator_status],
      token: dbRow.token,
      secret: dbRow.secret,
      status: preLaunchInviteConstants.statuses[dbRow.status],
      adminStatus: preLaunchInviteConstants.adminStatuses[dbRow.admin_status],
      inviterUserId: dbRow.inviter_user_id,
      inviteCode: dbRow.invite_code,
      inviterCodeId: dbRow.inviter_code_id,
      inviteCodeId: dbRow.invite_code_id,
      invitedUserCount: dbRow.invited_user_count,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch pre launch invite by id.
   *
   * @param {string} id
   *
   * @returns {object}
   */
  async fetchById(id) {
    const oThis = this;

    const res = await oThis.fetchByIds([id]);

    return res[id] || {};
  }

  /**
   * Fetch pre launch invite by ids.
   *
   * @param {array} ids
   *
   * @returns {object}
   */
  async fetchByIds(ids) {
    const oThis = this;

    const dbRows = await oThis
      .select([
        'id',
        'twitter_id',
        'handle',
        'email',
        'name',
        'profile_image_url',
        'creator_status',
        'admin_status',
        'status',
        'inviter_user_id',
        'invite_code',
        'inviter_code_id',
        'invite_code_id',
        'invited_user_count',
        'created_at',
        'updated_at'
      ])
      .where({ id: ids })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<*>}
   */
  static async flushCache() {
    // Do nothing.
  }
}

module.exports = PreLaunchInvite;
