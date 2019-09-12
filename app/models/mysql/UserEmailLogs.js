const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.bigDbName;

/**
 * Class for user email logs model.
 *
 * @class UserEmailLogs
 */
class UserEmailLogs extends ModelBase {
  /**
   * Constructor for user email logs model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_email_logs';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.email
   * @param {number} dbRow.temporary_token_id
   * @param {number/string} dbRow.created_at
   * @param {number/string} dbRow.updated_at
   *
   * @returns {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      email: dbRow.email,
      temporaryTokenId: dbRow.temporary_token_id,
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
    return ['id', 'email', 'temporaryTokenId', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch user email log id.
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
   * Fetch temporary token by ids.
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
}

module.exports = UserEmailLogs;
