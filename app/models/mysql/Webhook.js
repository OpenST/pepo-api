const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.ostDbName;

/**
 * Class for webhook model.
 *
 * @class Webhook
 */
class Webhook extends ModelBase {
  /**
   * Constructor for webhook model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'webhooks';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.ost_id
   * @param {string} dbRow.status
   * @param {string} dbRow.secret
   * @param {string} dbRow.encryption_salt
   * @param {string} dbRow.created_at
   * @param {string} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      ostId: dbRow.ost_id,
      status: dbRow.status,
      secret: dbRow.secret,
      encryptionSalt: dbRow.encryption_salt,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch webhook by ost id.
   *
   * @param {string/number} ostId
   *
   * @returns {Promise<*>}
   */
  async fetchWebhookByOstId(ostId) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where(['ost_id = ?', ostId])
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }
}

module.exports = Webhook;
