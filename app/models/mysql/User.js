const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  apiRefererConstants = require(rootPrefix + '/lib/globalConstant/apiReferers');

// Declare variables names.
const dbName = databaseConstants.userDbName;

/**
 * Class for user model.
 *
 * @class UserModel
 */
class UserModel extends ModelBase {
  /**
   * Constructor for user model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'users';
  }

  /**
   * Bitwise config.
   *
   * @return {object}
   */
  get bitwiseConfig() {
    return {
      properties: userConstants.properties
    };
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {string} dbRow.id
   * @param {string} dbRow.user_name
   * @param {string} dbRow.name
   * @param {string} dbRow.profile_image_id
   * @param {string} dbRow.password
   * @param {string} dbRow.cookie_token
   * @param {string} dbRow.encryption_salt
   * @param {number} dbRow.mark_inactive_trigger_count
   * @param {number} dbRow.properties
   * @param {string} dbRow.email
   * @param {string} dbRow.external_user_id
   * @param {number} dbRow.status
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      userName: dbRow.user_name,
      name: dbRow.name,
      profileImageId: dbRow.profile_image_id,
      password: dbRow.password,
      cookieToken: dbRow.cookie_token,
      encryptionSalt: dbRow.encryption_salt,
      markInactiveTriggerCount: dbRow.mark_inactive_trigger_count,
      properties: dbRow.properties,
      email: dbRow.email,
      externalUserId: dbRow.external_user_id,
      approvedCreator: UserModel.isUserApprovedCreator(dbRow),
      status: userConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List Of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return [
      'id',
      'userName',
      'name',
      'profileImageId',
      'markInactiveTriggerCount',
      'externalUserId',
      'properties',
      'approvedCreator',
      'status',
      'createdAt',
      'updatedAt'
    ];
  }

  /**
   * Fetch user by username.
   *
   * @param {string} userName: user name
   *
   * @return {object}
   */
  async fetchByUserName(userName) {
    const oThis = this;

    const dbRows = await oThis
      .select(['id', 'user_name'])
      .where(['user_name = ?', userName])
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /**
   * Fetch user by user names.
   *
   * @param {Array} userNames: user names
   *
   * @return {object}
   */
  async fetchByUserNames(userNames) {
    const oThis = this;

    const dbRows = await oThis
      .select(['id', 'user_name', 'status'])
      .where(['user_name IN (?)', userNames])
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      const userName = formatDbRow.userName.toLowerCase();
      response[userName] = formatDbRow;
    }

    return response;
  }

  /**
   * Fetch secure user by id.
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
   * Fetch secure user by ids.
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
        'user_name',
        'name',
        'profile_image_id',
        'mark_inactive_trigger_count',
        'properties',
        'email',
        'status',
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
   * Fetch secure user by id.
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
   * Fetch user ids by email ids.
   *
   * @param {array<string>} emails
   *
   * @returns {Promise<{}>}
   */
  async fetchUserIdsByEmails(emails) {
    const oThis = this;

    const dbRows = await oThis
      .select('id, email')
      .where({ email: emails })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.email] = formatDbRow;
    }

    return response;
  }

  /**
   * Get cookie value for version v2.
   * // NOTE - this cookie versioning has been introduced on 22/01/2020.
   *
   * @param {object} userObj
   * @param {string} decryptedEncryptionSalt
   * @param {object} options
   *
   * @returns {string}
   */
  getCookieValueFor(userObj, decryptedEncryptionSalt, options) {
    const oThis = this;

    let cookieToken = null,
      version = 'v2';
    if (apiRefererConstants.isWebRequest(options.apiReferer)) {
      cookieToken = oThis.getCookieTokenForWeb(userObj, decryptedEncryptionSalt, options);
      version = apiRefererConstants.webReferer;
    } else {
      cookieToken = oThis.getCookieTokenForVersionV2(userObj, decryptedEncryptionSalt, options);
    }

    return version + ':' + userObj.id + ':' + options.loginServiceType + ':' + options.timestamp + ':' + cookieToken;
  }

  /**
   * Get cookie token.
   *
   * @param {object} userObj
   * @param {string} decryptedEncryptionSalt
   * @param {object} options
   *
   * @returns {string}
   */
  getCookieTokenFor(userObj, decryptedEncryptionSalt, options) {
    const uniqueStr = localCipher.decrypt(decryptedEncryptionSalt, userObj.cookieToken);

    const stringToSign =
      userObj.id +
      ':' +
      options.timestamp +
      ':' +
      coreConstants.PA_COOKIE_TOKEN_SECRET +
      ':' +
      uniqueStr.substring(0, 16);
    const salt =
      userObj.id + ':' + uniqueStr.slice(-16) + ':' + coreConstants.PA_COOKIE_TOKEN_SECRET + ':' + options.timestamp;

    return util.createSha256Digest(salt, stringToSign);
  }

  /**
   * Get cookie token for version v2.
   *
   * @param {object} userObj
   * @param {string} decryptedEncryptionSalt
   * @param {object} options
   *
   * @returns {string}
   */
  getCookieTokenForVersionV2(userObj, decryptedEncryptionSalt, options) {
    const uniqueStr = localCipher.decrypt(decryptedEncryptionSalt, userObj.cookieToken);

    const stringToSign =
      'v2' +
      ':' +
      userObj.id +
      ':' +
      options.loginServiceType +
      ':' +
      options.timestamp +
      ':' +
      coreConstants.PA_COOKIE_TOKEN_SECRET +
      ':' +
      uniqueStr.substring(0, 16);
    const salt =
      'v2' +
      ':' +
      userObj.id +
      ':' +
      uniqueStr.slice(-16) +
      ':' +
      coreConstants.PA_COOKIE_TOKEN_SECRET +
      ':' +
      options.timestamp +
      ':' +
      options.loginServiceType;

    return util.createSha256Digest(salt, stringToSign);
  }

  /**
   * Get cookie token for web.
   *
   * @param {object} userObj
   * @param {string} decryptedEncryptionSalt
   * @param {object} options
   *
   * @returns {string}
   */
  getCookieTokenForWeb(userObj, decryptedEncryptionSalt, options) {
    const uniqueStr = localCipher.decrypt(decryptedEncryptionSalt, userObj.cookieToken);

    const stringToSign =
      apiRefererConstants.webReferer +
      ':' +
      userObj.id +
      ':' +
      options.loginServiceType +
      ':' +
      options.timestamp +
      ':' +
      coreConstants.WEB_COOKIE_SECRET +
      ':' +
      uniqueStr.substring(0, 16);
    const salt =
      apiRefererConstants.webReferer +
      ':' +
      userObj.id +
      ':' +
      uniqueStr.slice(-16) +
      ':' +
      coreConstants.WEB_COOKIE_SECRET +
      ':' +
      options.timestamp +
      ':' +
      options.loginServiceType;

    return util.createSha256Digest(salt, stringToSign);
  }

  /**
   * User search.
   *
   * @param {number} params.limit: limit
   * @param {string} params.query: query
   * @param {number} params.paginationTimestamp: pagination time stamp
   * @param {boolean} params.fetchAll: flag to fetch all users, active or inactive
   * @param {boolean} params.isOnlyNameSearch
   * @param {string} params.sortBy: order query by
   * @param {string} params.filter: filter
   *
   * @return {Promise}
   */
  async search(params) {
    const oThis = this;

    const limit = params.limit,
      query = params.query,
      paginationTimestamp = params.paginationTimestamp,
      isOnlyNameSearch = params.isOnlyNameSearch;

    const queryObject = oThis
      .select('id, user_name, name, email, properties, status, profile_image_id, created_at, updated_at')
      .limit(limit);

    if (params.sortBy && params.sortBy === userConstants.ascendingSortByValue) {
      queryObject.order_by('id asc');
    } else {
      queryObject.order_by('id desc');
    }

    const queryWithWildCards = query + '%',
      queryWithWildCardsSpaceIncluded = '% ' + query + '%';

    if (!params.fetchAll) {
      queryObject.where({ status: userConstants.invertedStatuses[userConstants.activeStatus] });
    }

    if (query && isOnlyNameSearch) {
      queryObject.where(['name LIKE ? OR name LIKE ?', queryWithWildCards, queryWithWildCardsSpaceIncluded]);
    }

    if (query && !isOnlyNameSearch) {
      queryObject.where([
        'user_name LIKE ? OR name LIKE ? OR name LIKE ?',
        queryWithWildCards,
        queryWithWildCards,
        queryWithWildCardsSpaceIncluded
      ]);
    }

    // Filter users by creator statuses
    const approvedPropertyVal = userConstants.invertedProperties[userConstants.isApprovedCreatorProperty],
      deniedPropertyVal = userConstants.invertedProperties[userConstants.isDeniedCreatorProperty];
    switch (params.filter) {
      case userConstants.pendingCreatorFilterValue: {
        queryObject.where([
          'properties != (properties | ?) AND properties != (properties | ?)',
          approvedPropertyVal,
          deniedPropertyVal
        ]);
        break;
      }
      case userConstants.approvedCreatorFilterValue: {
        queryObject.where(['properties = properties | ?', approvedPropertyVal]);
        break;
      }
      case userConstants.deniedCreatorFilterValue: {
        queryObject.where(['properties = properties | ?', deniedPropertyVal]);
        break;
      }
      default: {
        // Do nothing.
      }
    }

    if (paginationTimestamp) {
      if (params.sortBy && params.sortBy === userConstants.ascendingSortByValue) {
        queryObject.where(['created_at >= ?', paginationTimestamp]);
      } else {
        queryObject.where(['created_at < ?', paginationTimestamp]);
      }
    }

    const dbRows = await queryObject.fire();

    const userDetails = {};
    const userIds = [];

    for (let ind = 0; ind < dbRows.length; ind++) {
      const formattedRow = oThis.formatDbData(dbRows[ind]);
      userIds.push(formattedRow.id);
      userDetails[dbRows[ind].id] = formattedRow;
    }

    return { userIds: userIds, userDetails: userDetails };
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {string/number} params.id
   * @param {string} params.userName
   * @param {string} params.email
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    const UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User');
    promisesArray.push(new UserCache({ ids: [params.id] }).clear());

    const SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser');
    promisesArray.push(new SecureUserCache({ id: params.id }).clear());

    if (params.userName) {
      const UserIdByUserNamesCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdByUserNames');
      promisesArray.push(new UserIdByUserNamesCache({ userNames: [params.userName] }).clear());
    }

    if (params.email) {
      const UserByEmailsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserByEmails');
      promisesArray.push(new UserByEmailsCache({ emails: [params.email] }).clear());
    }

    await Promise.all(promisesArray);
  }

  /**
   * Get username unique index name.
   *
   * @returns {string}
   */
  static get usernameUniqueIndexName() {
    return 'uk_idx_1';
  }

  /**
   * Get email unique index name.
   *
   * @returns {string}
   */
  static get emailUniqueIndexName() {
    return 'uk_idx_2';
  }

  /**
   * Is user an approved creator?
   *
   * @param {object} userObj
   *
   * @returns {boolean}
   */
  static isUserApprovedCreator(userObj) {
    const propertiesArray = new UserModel().getBitwiseArray('properties', userObj.properties);

    return propertiesArray.indexOf(userConstants.isApprovedCreatorProperty) > -1;
  }

  /**
   * Is user denied as creator.
   *
   * @param {object} userObj
   *
   * @returns {boolean}
   */
  static isUserDeniedCreator(userObj) {
    const propertiesArray = new UserModel().getBitwiseArray('properties', userObj.properties);

    return propertiesArray.indexOf(userConstants.isDeniedCreatorProperty) > -1;
  }

  /**
   * Is user logged in from twitter.
   *
   * @param {object} userObj
   *
   * @returns {boolean}
   */
  static isUserTwitterLogin(userObj) {
    const propertiesArray = new UserModel().getBitwiseArray('properties', userObj.properties);

    return propertiesArray.indexOf(userConstants.hasTwitterLoginProperty) > -1;
  }

  /**
   * Is user logged in from github.
   *
   * @param {object} userObj
   *
   * @returns {boolean}
   */
  static isUserGithubLogin(userObj) {
    const propertiesArray = new UserModel().getBitwiseArray('properties', userObj.properties);

    return propertiesArray.indexOf(userConstants.hasGithubLoginProperty) > -1;
  }
}

module.exports = UserModel;
