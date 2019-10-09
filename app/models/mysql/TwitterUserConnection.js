const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  twitterUserConnectionConstants = require(rootPrefix + '/lib/globalConstant/twitterUserConnection');

// Declare variables.
const dbName = databaseConstants.twitterDbName;

/**
 * Class for twitter user connection model.
 *
 * @class TwitterUserConnection
 */
class TwitterUserConnection extends ModelBase {
  /**
   * Constructor for twitter user connection model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'twitter_user_connections';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      twitterUser1Id: dbRow.twitter_user1_id,
      twitterUser2Id: dbRow.twitter_user2_id,
      properties: dbRow.properties,
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
    return ['id', 'twitterUser1Id', 'twitterUser2Id', 'properties', 'createdAt', 'updatedAt'];
  }

  /**
   * Bitwise config.
   *
   * @return {object}
   */
  get bitwiseConfig() {
    return {
      properties: twitterUserConnectionConstants.properties
    };
  }

  /**
   * Fetch twitter user 1 ids for twitter user id2
   *
   * @param {object} params
   * @param {array} params.twitterUser2Id
   * @param {number} [params.page]
   * @param {number} [params.limit]
   *
   * @returns {Promise<*>}
   */
  async fetchByTwitterUser2Id(params) {
    const oThis = this;

    const page = params.page,
      limit = params.limit,
      twitterUser2Id = params.twitterUser2Id,
      offset = (page - 1) * limit;

    const dbRows = await oThis
      .select(['twitter_user1_id', 'id'])
      .where({ twitter_user2_id: twitterUser2Id })
      .limit(limit)
      .offset(offset)
      .order_by('id DESC')
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Fetch twitter user connection object for twitter user id1 and twitter user id2
   *
   * @param {string} twitterUser1Id: twitter user id 1
   * @param {string} twitterUser2Id: twitter user id 2 (followed by twitter user id 1)
   *
   * @return {Object}
   */
  async fetchByTwitterUser1IdAndTwitterUser2Id(twitterUser1Id, twitterUser2Id) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ twitter_user1_id: twitterUser1Id, twitter_user2_id: twitterUser2Id })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /**
   * Fetch contributed by user ids
   *
   * @param {object} params
   * @param {array} params.twitterUser1Id
   * @param {number} [params.page]
   * @param {number} [params.limit]
   *
   * @returns {Promise<*>}
   */
  async fetchPaginatedTwitterUser2IdsForTwitterUser1Id(params) {
    const oThis = this;

    // NOTE: Has Contributed Property should not be set
    const twitterUser2RegisteredVal = oThis.setBitwise(
      'properties',
      0,
      twitterUserConnectionConstants.isTwitterUser2RegisteredProperty
    );

    const page = params.page,
      limit = params.limit,
      offset = (page - 1) * limit;

    const dbRows = await oThis
      .select(['twitter_user2_id', 'id'])
      .where({ twitter_user1_id: params.twitterUser1Id, properties: twitterUser2RegisteredVal })
      .limit(limit)
      .offset(offset)
      .order_by('id DESC')
      .fire();

    const response = [];

    for (let index = 0; index < dbRows.length; index++) {
      response.push(dbRows[index].twitter_user2_id);
    }

    return response;
  }

  /**
   * Create twitter user connection.
   *
   * @param {object} params
   * @param {integer} params.twitterUser1Id
   * @param {integer} params.twitterUser2Id
   * @param {integer} params.propertiesVal
   *
   * @returns {Promise<*>}
   */
  async updateTwitterUserConnection(params) {
    const oThis = this;

    return oThis
      .update(['properties = properties | ?', params.propertiesVal])
      .where({
        twitter_user1_id: params.twitterUser1Id,
        twitter_user2_id: params.twitterUser2Id
      })
      .where(['properties != properties | ?', params.propertiesVal])
      .fire();
  }

  /**
   * Fetch twitter user connections by twitter user1 id and twitter user2 ids
   * @param twitterUser2Ids
   * @param twitterUser1Id
   * @returns {Promise<void>}
   */
  async fetchTwitterUserConnectionByTwitterUser1IdAndTwitterUser2Ids(twitterUser2Ids, twitterUser1Id) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where(['twitter_user2_id IN (?) AND twitter_user1_id = (?)', twitterUser2Ids, twitterUser1Id])
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.twitterUser2Id] = formatDbRow;
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.twitterUser1Id
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const TwitterUserConnectionByUser1Pagination = require(rootPrefix +
      '/lib/cacheManagement/single/TwitterUserConnectionByUser1Pagination');

    await new TwitterUserConnectionByUser1Pagination({
      twitterUser1Id: params.twitterUser1Id
    }).clear();
  }
}

module.exports = TwitterUserConnection;
