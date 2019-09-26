const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended');

// Declare variables.
const dbName = databaseConstants.twitterDbName;

/**
 * Class for twitter user extended model.
 *
 * @class TwitterUserExtendedModel
 */
class TwitterUserExtendedModel extends ModelBase {
  /**
   * Constructor for twitter user extended model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'twitter_users_extended';
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
      twitterUserId: dbRow.twitter_user_id,
      userId: dbRow.user_id,
      token: dbRow.token,
      secret: dbRow.secret,
      accessType: twitterUserExtendedConstants.accessTypes[dbRow.access_type],
      status: twitterUserExtendedConstants.statuses[dbRow.status],
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
    return ['id', 'userId', 'twitterUserId', 'accessType', 'status', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch Secure twitter user extended object for twitter user id
   *
   * @param {number} twitterUserId: twitter user id
   *
   * @return {object}
   */
  async fetchSecureByTwitterUserId(twitterUserId) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ twitter_user_id: twitterUserId })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.twitterUserId
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const SecureTwitterUserExtendedByTwitterUserIdCache = require(rootPrefix +
      '/lib/cacheManagement/single/SecureTwitterUserExtendedByTwitterUserId');

    await new SecureTwitterUserExtendedByTwitterUserIdCache({
      twitterUserId: params.twitterUserId
    }).clear();
  }
}

module.exports = TwitterUserExtendedModel;
