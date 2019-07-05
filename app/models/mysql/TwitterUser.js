const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  twitterUserConstants = require(rootPrefix + '/lib/globalConstant/twitterUser'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

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
  }
}

module.exports = TwitterUserModel;
