const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  preLaunchInviteConstant = require(rootPrefix + '/lib/globalConstant/preLaunchInviteConstant');

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
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.twitter_id
   * @param {string} dbRow.email
   * @param {string} dbRow.name
   * @param {string} dbRow.profile_image_url
   * @param {string} dbRow.token
   * @param {string} dbRow.secret
   * @param {number} dbRow.status
   * @param {number} dbRow.invitee_user_id
   * @param {string} dbRow.invite_code
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
      twitterId: dbRow.twitter_id,
      email: dbRow.email,
      name: dbRow.name,
      profileImageUrl: dbRow.profile_image_url,
      token: dbRow.token,
      secret: dbRow.secret,
      status: preLaunchInviteConstant.statuses[dbRow.status],
      inviteeUserId: dbRow.invitee_user_id,
      inviteCode: dbRow.invite_code,
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
   * @return {object}
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
   * @return {object}
   */
  async fetchByIds(ids) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
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
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    // Do nothing.
  }
}

module.exports = PreLaunchInvite;
