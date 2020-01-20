const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  webhookEndpointConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEndpoint');

// Declare variables names.
const dbName = databaseConstants.webhookDbName;

/**
 * Class for webhook endpoints model.
 *
 * @class WebhookEndpointModel
 */
class WebhookEndpointModel extends ModelBase {
  /**
   * Constructor for webhook endpoints model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'webhook_endpoints';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.uuid
   * @param {number} dbRow.client_id
   * @param {number} dbRow.api_version
   * @param {string} dbRow.endpoint
   * @param {string} dbRow.secret
   * @param {string} dbRow.grace_secret
   * @param {string} dbRow.secret_salt
   * @param {number} dbRow.grace_expiry_at
   * @param {number} dbRow.status
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @returns {{}}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      uuid: dbRow.uuid,
      clientId: dbRow.client_id,
      apiVersion: webhookEndpointConstants.apiVersions[dbRow.api_version],
      endpoint: dbRow.endpoint,
      secret: dbRow.secret,
      graceSecret: dbRow.grace_secret,
      secretSalt: dbRow.secret_salt,
      graceExpiryAt: dbRow.grace_expiry_at,
      status: webhookEndpointConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List Of formatted column names that can be exposed by service.
   *
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return ['id', 'uuid', 'clientId', 'apiVersion', 'endpoint', 'status', 'createdAt', 'updatedAt'];
  }

  /**
   * Get rows by uuid.
   *
   * @param {object} params
   * @param {Array} params.uuids
   *
   * @returns {Promise<*>}
   */
  async getByUuids(params) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ uuid: params.uuids })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.uuid] = formatDbRow;
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.uuid) {
      const WebhookEndpointByUuidsCache = require(rootPrefix + '/lib/cacheManagement/multi/WebhookEndpointByUuids');
      promisesArray.push(new WebhookEndpointByUuidsCache({ uuids: [params.uuid] }).clear());
    }

    await Promise.all(promisesArray);
  }
}

module.exports = WebhookEndpointModel;
