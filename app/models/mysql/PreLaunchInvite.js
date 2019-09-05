const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
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
      'status',
      'adminStatus',
      'inviterUserId',
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
   * @param {number} dbRow.handle
   * @param {string} dbRow.email
   * @param {string} dbRow.name
   * @param {string} dbRow.profile_image_url
   * @param {string} dbRow.token
   * @param {string} dbRow.secret
   * @param {number} dbRow.status
   * @param {number} dbRow.admin_status
   * @param {number} dbRow.inviter_user_id
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
      encryptionSalt: dbRow.encryption_salt,
      twitterId: dbRow.twitter_id,
      handle: dbRow.handle,
      email: dbRow.email,
      name: dbRow.name,
      profileImageUrl: dbRow.profile_image_url,
      token: dbRow.token,
      secret: dbRow.secret,
      status: preLaunchInviteConstants.statuses[dbRow.status],
      adminStatus: preLaunchInviteConstants.adminStatuses[dbRow.admin_status],
      inviteeUserId: dbRow.inviter_user_id,
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
        'status',
        'inviter_user_id',
        'invite_code',
        'invited_user_count',
        'created_at',
        'updated_at'
      ])
      .where({ id: ids })
      .fire();

    const inviteDetails = {};
    const inviteIds = [];

    for (let ind = 0; ind < dbRows.length; ind++) {
      const formattedRow = oThis.formatDbData(dbRows[ind]);
      inviteIds.push(formattedRow.id);
      inviteDetails[dbRows[ind].id] = formattedRow;
    }

    return { inviteIds: inviteIds, inviteDetails: inviteDetails };
  }

  /**
   * Fetch secure pre launch invite by id.
   *
   * @param {number} id: user id
   *
   * @returns {object}
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
   * @returns {object}
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
   * Whitelist user.
   *
   * @param {number} inviteId
   *
   * @returns {Promise<result>}
   */
  async whitelistUser(inviteId) {
    const oThis = this;

    const queryResponse = await oThis
      .update({ status: preLaunchInviteConstants.invertedAdminStatuses[preLaunchInviteConstants.whitelistedStatus] })
      .where({ id: inviteId })
      .fire();

    if (queryResponse.affectedRows === 1) {
      logger.info(`User with ${inviteId} is now whitelisted`);

      const userObject = await oThis
        .select('twitter_id')
        .where({ id: inviteId })
        .fire();

      const twitterId = userObject[0].twitter_id;

      await PreLaunchInvite.flushCache({ id: inviteId, twitterId: twitterId });

      return responseHelper.successWithData({});
    }

    return responseHelper.error({
      internal_error_identifier: 'a_m_m_pli_1',
      api_error_identifier: 'something_went_wrong',
      debug_options: { inviteId: inviteId }
    });
  }

  /**
   * Search users for admin whitelisting.
   *
   * @param {object} params
   * @param {integer} params.limit: limit
   * @param {integer} params.query: query
   * @param {string}  params.sortBy: sort string
   * @param {integer} params.pageNo: page no
   *
   * @returns {object}
   */
  async search(params) {
    const oThis = this;

    const limit = params.limit,
      query = params.query,
      sortBy = params.sortBy,
      pageNo = params.pageNo,
      offset = (pageNo - 1) * limit;

    const queryObject = oThis
      .select(['id', 'handle', 'email', 'name', 'profile_image_url', 'status', 'admin_status', 'updated_at'])
      .limit(limit)
      .offset(offset);

    switch (sortBy) {
      case preLaunchInviteConstants.ascendingSortByValue: {
        queryObject.order_by('id asc');
        break;
      }
      case preLaunchInviteConstants.descendingSortByValue: {
        queryObject.order_by('id desc');
        break;
      }
      case preLaunchInviteConstants.ascendingStatusSortByValue: {
        queryObject.order_by('FIELD(admin_status, 1,2), id desc');
        break;
      }
      case preLaunchInviteConstants.descendingStatusSortByValue: {
        queryObject.order_by('FIELD(admin_status, 2,1), id desc');
        break;
      }
      default: {
        queryObject.order_by('id desc');
        break;
      }
    }

    const queryWithWildCards = '%' + query + '%';

    if (query) {
      queryObject.where(['handle LIKE ? OR name LIKE ?', queryWithWildCards, queryWithWildCards]);
    }

    const dbRows = await queryObject.fire();

    let inviteDetails = {};
    let inviteIds = [];

    for (let ind = 0; ind < dbRows.length; ind++) {
      let formattedRow = oThis.formatDbData(dbRows[ind]);
      inviteIds.push(formattedRow.id);
      inviteDetails[dbRows[ind].id] = formattedRow;
    }

    return { inviteIds: inviteIds, inviteDetails: inviteDetails };
  }

  /**
   * Fetch pre launch invite by invite code.
   *
   * @param {number} inviteCode: invite code
   *
   * @return {object}
   */
  async fetchByInviteCode(inviteCode) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where(['invite_code = ?', inviteCode])
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /**
   * Get cookie value.
   *
   * @param {object} preLaunchInviteObj
   * @param {string} decryptedEncryptionSalt
   * @param {object} options
   * @param {number} options.timestamp
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
   * @param {number} options.timestamp
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
   * @param {number} params.id
   * @param {number} params.twitterId
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.id) {
      const PreLaunchInviteByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PreLaunchInviteByIds');
      promisesArray.push(new PreLaunchInviteByIdsCache({ ids: [params.id] }).clear());

      const securePreLaunchInviteCache = require(rootPrefix + '/lib/cacheManagement/single/SecurePreLaunchInvite');
      promisesArray.push(new securePreLaunchInviteCache({ id: params.id }).clear());
    }

    if (params.twitterId) {
      const PreLaunchInviteByTwitterIdsCache = require(rootPrefix +
        '/lib/cacheManagement/multi/PreLaunchInviteByTwitterIds');
      promisesArray.push(new PreLaunchInviteByTwitterIdsCache({ twitterIds: [params.twitterId] }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = PreLaunchInvite;
