const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

class TwitterUserModel extends ModelBase {
  /**
   * Twitter User Extended model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'twitter_users_extended';
  }

  /**
   *
   * @param dbRow
   * @return {object}
   */
  formatDbData(dbRow) {
    return {
      id: dbRow.id,
      twitterUserId: dbRow.twitter_user_id,
      userId: dbRow.user_id,
      token: dbRow.token,
      secret: dbRow.secret,
      status: twitterUserExtendedConstants.statuses[dbRow.status],
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
    return ['id', 'userId', 'twitterUserId', 'status', 'createdAt', 'updatedAt'];
  }

  /***
   * Fetch Secure twitter user extended object for twitter user id
   *
   * @param twitterUserIds {Integer} - twitter user id
   *
   * @return {Object}
   */
  async fetchSecureByTwitterUserId(twitterUserId) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where({ twitter_user_id: twitterUserId })
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
  static async flushCache(params) {
    const SecureTwitterUserExtendedByTwitterUserIdCache = require(rootPrefix +
      '/lib/cacheManagement/single/SecureTwitterUserExtendedByTwitterUserId');

    await new SecureTwitterUserExtendedByTwitterUserIdCache({
      twitterUserid: params.twitterUserid
    }).clear();
  }
}

module.exports = TwitterUserModel;
