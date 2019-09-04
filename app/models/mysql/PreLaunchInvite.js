const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  preLaunchInviteConstant = require(rootPrefix + '/lib/globalConstant/preLaunchInvite');

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
   * List Of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return [
      'id',
      'twitterId',
      'email',
      'name',
      'profileImageUrl',
      'status',
      'inviteeUserId',
      'inviteCode',
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
      .select([
        'id',
        'twitter_id',
        'email',
        'name',
        'profile_image_url',
        'status',
        'invitee_user_id',
        'invite_code',
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
   * Fetch secure pre launch invite by id.
   *
   * @param {number} id: user id
   *
   * @return {object}
   */
  async fetchSecureById(id) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where(['id = ?', id])
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /**
   * Fetch pre launch invite by twitterIds.
   *
   * @param {array} twitterIds
   *
   * @return {object}
   */
  async fetchByTwitterIds(twitterIds) {
    const oThis = this;

    const dbRows = await oThis
      .select(['id', 'twitter_id'])
      .where({ twitter_id: twitterIds })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.twitterId] = formatDbRow;
    }

    return response;
  }

  /**
   * Get cookie value.
   *
   * @param {object} preLaunchInviteObj
   * @param {string} decryptedEncryptionSalt
   * @param {object} options
   *
   * @returns {string}
   */
  getCookieValueFor(preLaunchInviteObj, decryptedEncryptionSalt, options) {
    const oThis = this;

    return (
      preLaunchInviteObj.id +
      ':' +
      options.timestamp +
      ':' +
      oThis.getCookieTokenFor(preLaunchInviteObj, decryptedEncryptionSalt, options)
    );
  }

  /**
   * Get cookie token.
   *
   * @param {object} preLaunchInviteObj
   * @param {string} decryptedEncryptionSalt
   * @param {object} options
   *
   * @returns {string}
   */
  getCookieTokenFor(preLaunchInviteObj, decryptedEncryptionSalt, options) {
    const uniqueStr = localCipher.decrypt(decryptedEncryptionSalt, preLaunchInviteObj.secret);

    const stringToSign =
      preLaunchInviteObj.id +
      ':' +
      options.timestamp +
      ':' +
      coreConstants.WEB_COOKIE_SECRET +
      ':' +
      uniqueStr.substring(0, 16);
    const salt =
      preLaunchInviteObj.id +
      ':' +
      uniqueStr.slice(-16) +
      ':' +
      coreConstants.PA_COOKIE_TOKEN_SECRET +
      ':' +
      options.timestamp;

    return util.createSha256Digest(salt, stringToSign);
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
