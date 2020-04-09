const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  UserMuteByUser2IdsForGlobalCache = require(rootPrefix + '/lib/cacheManagement/multi/UserMuteByUser2IdsForGlobal'),
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  apiSourceConstants = require(rootPrefix + '/lib/globalConstant/apiSource');

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
      'updatedAt',
      'isUserGlobalMuted',
      'isManagingAnyChannel'
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

    const promisesArray = [
      new UserMuteByUser2IdsForGlobalCache({ user2Ids: ids }).fetch(),
      oThis
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
        .fire()
    ];

    const promisesResponse = await Promise.all(promisesArray);

    const globalMuteUsersCacheResponse = promisesResponse[0];
    if (globalMuteUsersCacheResponse.isFailure()) {
      return Promise.reject(globalMuteUsersCacheResponse);
    }
    const dbRows = promisesResponse[1];

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const userId = dbRows[index].id;
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
      response[formatDbRow.id].isUserGlobalMuted = globalMuteUsersCacheResponse.data[userId].all == 1;
      response[formatDbRow.id].isManagingAnyChannel = UserModel.isUserManagingChannel(formatDbRow);
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

    const promisesArray = [
      oThis
        .select('*')
        .where(['id = ?', id])
        .fire(),
      new UserMuteByUser2IdsForGlobalCache({ user2Ids: [id] }).fetch()
    ];

    const promisesResponse = await Promise.all(promisesArray);

    const dbRows = promisesResponse[0];
    if (dbRows.length === 0) {
      return {};
    }
    const response = oThis.formatDbData(dbRows[0]);

    const globalMuteUsersCacheResponse = promisesResponse[1];
    if (globalMuteUsersCacheResponse.isFailure()) {
      return Promise.reject(globalMuteUsersCacheResponse);
    }
    response.isUserGlobalMuted = globalMuteUsersCacheResponse.data[id].all == 1;
    response.isManagingAnyChannel = UserModel.isUserManagingChannel(response);

    return response;
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
   * Get cookie token for different sources.
   *
   * @param {object} userObj
   * @param {string} decryptedEncryptionSalt
   * @param {object} options
   *
   * @returns {string}
   */
  getTokenFor(userObj, decryptedEncryptionSalt, options) {
    const uniqueStr = localCipher.decrypt(decryptedEncryptionSalt, userObj.cookieToken);

    let version = null,
      strSecret = null;

    if (apiSourceConstants.isAppRequest(options.apiSource)) {
      version = 'v2';
      strSecret = coreConstants.PA_COOKIE_TOKEN_SECRET;
    } else if (
      apiSourceConstants.isWebViewRequest(options.apiSource) ||
      apiSourceConstants.isStoreRequest(options.apiSource) ||
      apiSourceConstants.isWebRequest(options.apiSource)
    ) {
      version = options.apiSource;
      strSecret = coreConstants.WEB_COOKIE_SECRET;
    } else {
      throw new Error(`Invalid api_source-${options.apiSource} for getCookieToken`);
    }

    const stringToSign =
      version +
      ':' +
      userObj.id +
      ':' +
      options.loginServiceType +
      ':' +
      options.timestamp +
      ':' +
      strSecret +
      ':' +
      uniqueStr.substring(0, 16);
    const salt =
      version +
      ':' +
      userObj.id +
      ':' +
      uniqueStr.slice(-16) +
      ':' +
      strSecret +
      ':' +
      options.timestamp +
      ':' +
      options.loginServiceType;

    return util.createSha256Digest(salt, stringToSign);
  }

  /**
   * Get cookie token for different sources.
   *
   * @param {object} userObj
   * @param {string} decryptedEncryptionSalt
   * @param {object} options
   *
   * @returns {string}
   */
  getCookieValueFor(userObj, decryptedEncryptionSalt, options) {
    const oThis = this;

    const cookieToken = oThis.getTokenFor(userObj, decryptedEncryptionSalt, options);
    let version = null;

    if (apiSourceConstants.isAppRequest(options.apiSource)) {
      version = 'v2';
    } else if (
      apiSourceConstants.isWebViewRequest(options.apiSource) ||
      apiSourceConstants.isStoreRequest(options.apiSource) ||
      apiSourceConstants.isWebRequest(options.apiSource)
    ) {
      version = options.apiSource;
    } else {
      throw new Error(`Invalid api_source-${options.apiSource} for getCookieValueFor`);
    }

    return version + ':' + userObj.id + ':' + options.loginServiceType + ':' + options.timestamp + ':' + cookieToken;
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
      userDetails[formattedRow.id] = formattedRow;
    }

    const globalMuteUsersCacheResponse = await new UserMuteByUser2IdsForGlobalCache({ user2Ids: userIds }).fetch();
    if (globalMuteUsersCacheResponse.isFailure()) {
      return Promise.reject(globalMuteUsersCacheResponse);
    }

    for (let index = 0; index < userIds.length; index++) {
      const userId = userIds[index];
      userDetails[userId].isUserGlobalMuted = globalMuteUsersCacheResponse.data[userId].all == 1;
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

  /**
   * Is user channel Admin.
   *
   * @param {object} userObj
   *
   * @returns {boolean}
   */
  static isUserManagingChannel(userObj) {
    const propertiesArray = new UserModel().getBitwiseArray('properties', userObj.properties);

    return propertiesArray.indexOf(userConstants.isManagingChannelProperty) > -1;
  }

  /**
   * Approve users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async markUserChannelAdmin(userIds) {
    const oThis = this;

    const propertyVal = userConstants.invertedProperties[userConstants.isManagingChannelProperty];

    await new UserModel()
      .update(['properties = properties | ?', propertyVal])
      .where({ id: userIds })
      .fire();
  }

  /**
   * Approve users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async unmarkUserChannelAdmin(userIds) {
    const oThis = this;

    const propertyVal = userConstants.invertedProperties[userConstants.isManagingChannelProperty];

    await new UserModel()
      .update(['properties = properties & ~?', propertyVal])
      .where({ id: userIds })
      .fire();
  }
}

module.exports = UserModel;
