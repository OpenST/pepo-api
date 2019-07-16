const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  twitterUserConnectionConstants = require(rootPrefix + '/lib/globalConstant/twitterUserConnection'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

class TwitterUserConnection extends ModelBase {
  /**
   * Twitter User Connection model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'twitter_user_connections';
  }

  /**
   *
   * @param dbRow
   * @return {object}
   */
  formatDbData(dbRow) {
    return {
      id: dbRow.id,
      twitterUser1Id: dbRow.twitter_user1_id,
      twitterUser2Id: dbRow.twitter_user2_id,
      properties: dbRow.properties,
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
    return ['id', 'twitterUser1Id', 'twitterUser2Id', 'properties', 'createdAt', 'updatedAt'];
  }

  /***
   * Bitwise Config
   *
   * @return {Object}
   */
  get bitwiseConfig() {
    return {
      properties: twitterUserConnectionConstants.properties
    };
  }

  /***
   * Fetch twitter user connection object for twitter user id1 and twitter user id2
   *
   * @param twitterUser1Id {String} - twitter user id 1
   * @param twitterUser2Id {String} - twitter user id 2 (followed by twitter user id 1)
   *
   * @return {Object}
   */
  async fetchByTwitterUser1IdAndTwitterUser2Id(twitterUser1Id, twitterUser2Id) {
    const oThis = this;
    let dbRows = await oThis
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
   * @param {Array} params.twitterUser1Id
   * @param {number} [params.page]
   * @param {number} [params.limit]
   *
   * @returns {Promise<*>}
   */
  async fetchPaginatedTwitterUser2IdsForTwitterUser1Id(params) {
    const oThis = this;

    //NOTE: Has Contributed Property should not be set
    let twitterUser2RegisteredVal = oThis.setBitwise(
      'properties',
      0,
      twitterUserConnectionConstants.isTwitterUser2RegisteredProperty
    );

    const page = params.page,
      limit = params.limit,
      offset = (page - 1) * limit;

    let dbRows = await oThis
      .select(['twitter_user2_id', 'id'])
      .where({ twitter_user1_id: params.twitterUser1Id, properties: twitterUser2RegisteredVal })
      .limit(limit)
      .offset(offset)
      .order_by('id DESC')
      .fire();

    let response = [];

    for (let index = 0; index < dbRows.length; index++) {
      response.push(dbRows[index].twitter_user2_id);
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
  static async flushCache(params) {}
}

module.exports = TwitterUserConnection;
