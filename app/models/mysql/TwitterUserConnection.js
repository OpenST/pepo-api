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
