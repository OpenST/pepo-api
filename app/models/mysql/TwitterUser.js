const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.twitterDbName;

class TwitterUserModel extends ModelBase {
  /**
   * Twitter User model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'twitter_users';
  }

  /**
   *
   * @param dbRow
   * @return {object}
   */
  formatDbData(dbRow) {
    return {
      id: dbRow.id,
      twitterId: dbRow.twitter_id,
      email: dbRow.email,
      name: dbRow.name,
      profileImageUrl: dbRow.profile_image_url,
      userId: dbRow.user_id,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * List Of Formatted Column names that can be exposed by service
   *
   *
   * @returns {Array}
   */
  safeFormattedColumnNames() {
    return ['id', 'twitterId', 'email', 'name', 'profileImageUrl', 'userId', 'createdAt', 'updatedAt'];
  }

  /***
   * Fetch twitter user objects for twitter ids
   *
   * @param twitterId {Array} - Array of twitter Ids in str
   *
   * @return {Object}
   */
  async fetchByTwitterIds(twitterIds) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where({ twitter_id: twitterIds })
      .fire();

    let response = {};

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.twitterId] = formatDbRow;
    }

    return response;
  }

  /***
   * Fetch twitter user object ids for twitter ids
   *
   * @param UserIds {Array} - Array of User Ids
   *
   * @return {Object}
   */
  async fetchByUserIds(userIds) {
    const oThis = this;
    let dbRows = await oThis
      .select(['id', 'user_id'])
      .where({ user_id: userIds })
      .fire();

    let response = {};

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.userId] = formatDbRow;
    }

    return response;
  }

  /***
   * Fetch twitter user objects for ids
   *
   * @param ids {Array} - ids
   *
   * @return {Object}
   */
  async fetchByIds(ids) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where({ id: ids })
      .fire();

    let response = {};

    for (let index = 0; index < dbRows.length; index++) {
      let formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /***
   * Flush cache
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const TwitterUserByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByTwitterIds');
    await new TwitterUserByTwitterIdsCache({
      twitterIds: [params.twitterId]
    }).clear();

    const TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds');
    await new TwitterUserByIdsCache({
      idds: [params.id]
    }).clear();

    if (params.userId) {
      const TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds');
      await new TwitterUserByUserIdsCache({
        userIds: [params.userId]
      }).clear();
    }
  }
}

module.exports = TwitterUserModel;
