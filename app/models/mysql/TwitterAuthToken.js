const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  TwitterAuthTokenConstant = require(rootPrefix + '/lib/globalConstant/TwitterAuthToken');

// Declare variables.
const dbName = databaseConstants.twitterDbName;

/**
 * Class for Twitter Auth Tokens model.
 *
 * @class TwitterAuthToken
 */
class TwitterAuthToken extends ModelBase {
  /**
   * Constructor for Twitter Auth Tokens model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'twitter_auth_tokens';
  }

  /**
   * List Of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return ['id', 'token', 'secret', 'status', 'createdAt', 'updatedAt'];
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.token
   * @param {string} dbRow.secret
   * @param {number} dbRow.status
   * @param {number/string} dbRow.created_at
   * @param {number/string} dbRow.updated_at
   *
   * @returns {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      token: dbRow.token,
      secret: dbRow.secret,
      status: TwitterAuthTokenConstant.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch Twitter Auth Token by id.
   *
   * @param {string} id
   *
   * @return {object}
   */
  async fetchByToken(token) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where(['token = ?', token])
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /**
   * Fetch Twitter Auth Token by ids.
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
   * Flush cache.
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    // Do nothing.
  }
}

module.exports = TwitterAuthToken;
