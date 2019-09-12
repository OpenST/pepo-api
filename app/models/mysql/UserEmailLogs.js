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
   * @param {number} dbRow.user_id
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
    return ['id', 'email', 'userId', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch email by id.
   *
   * @param {number} id
   *
   * @returns {Promise<{email: (*|null)}>}
   */
  async fetchEmailById(id) {
    const oThis = this;

    const res = await oThis.fetchEmailByIds([id]);

    return res[id] || {};
  }

  /**
   * Fetch email by ids.
   *
   * @param {array<number>} ids
   *
   * @returns {Promise<void>}
   */
  async fetchEmailByIds(ids) {
    const oThis = this;

    const dbRows = await oThis
      .select('email, id')
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
