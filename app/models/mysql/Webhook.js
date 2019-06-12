/**
 * @file - Model for webhooks table
 */
const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

class Webhook extends ModelBase {
  /**
   * Webhook model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'webhooks';
  }

  /**
   * format db data
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
    return {
      id: dbRow.id,
      ostId: dbRow.ost_id,
      status: dbRow.status,
      secret: dbRow.secret,
      encryptionSalt: dbRow.encryption_salt,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Fetch webhook by ost id
   *
   * @param ostId
   * @returns {Promise<*>}
   */
  async fetchWebhookByOstId(ostId) {
    const oThis = this;

    let dbRows = await oThis
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
