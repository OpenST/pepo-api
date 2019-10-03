const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.twitterDbName;

/**
 * Class for twitter user model.
 *
 * @class TwitterUserModel
 */
class TwitterUserModel extends ModelBase {
  /**
   * Constructor for twitter user model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'twitter_users';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.twitter_id
   * @param {string} dbRow.email
   * @param {string} dbRow.handle
   * @param {string} dbRow.name
   * @param {string} dbRow.profile_image_url
   * @param {number} dbRow.user_id
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      twitterId: dbRow.twitter_id,
      email: dbRow.email,
      handle: dbRow.handle,
      name: dbRow.name,
      profileImageUrl: dbRow.profile_image_url,
      userId: dbRow.user_id,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return ['id', 'twitterId', 'email', 'handle', 'name', 'profileImageUrl', 'userId', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch twitter user objects by twitter ids.
   *
   * @param {array} twitterIds: Array of twitter Ids.
   *
   * @return {object}
   */
  async fetchByTwitterIds(twitterIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
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
   * Fetch twitter user object ids by user ids.
   *
   * @param {array} userIds: Array of user ids.
   *
   * @return {object}
   */
  async fetchByUserIds(userIds) {
    const oThis = this;

    const dbRows = await oThis
      .select(['id', 'user_id'])
      .where({ user_id: userIds })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.userId] = formatDbRow;
    }

    return response;
  }

  /**
   * Fetch twitter user objects for ids
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
   * Flush cache
   *
   * @param {object} params
   * @param {number} params.twitterId
   * @param {number} params.id
   * @param {number} [params.userId]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    const TwitterUserByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByTwitterIds');
    promisesArray.push(new TwitterUserByTwitterIdsCache({ twitterIds: [params.twitterId] }).clear());

    const TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds');
    promisesArray.push(new TwitterUserByIdsCache({ ids: [params.id] }).clear());

    if (params.userId) {
      const TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds');
      promisesArray.push(new TwitterUserByUserIdsCache({ userIds: [params.userId] }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = TwitterUserModel;
