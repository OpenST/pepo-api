const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  temporaryTokenConstants = require(rootPrefix + '/lib/globalConstant/big/temporaryToken');

// Declare variables.
const dbName = databaseConstants.bigDbName;

/**
 * Class for temporary token model.
 *
 * @class TemporaryTokenModel
 */
class TemporaryTokenModel extends ModelBase {
  /**
   * Constructor for temporary token model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'temporary_tokens';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.entity_id
   * @param {number} dbRow.kind
   * @param {string} dbRow.token
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
      entityId: dbRow.entity_id,
      kind: temporaryTokenConstants.kinds[dbRow.kind],
      token: dbRow.token,
      status: temporaryTokenConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List Of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return ['id', 'entityId', 'kind', 'token', 'status', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch temporary token by id.
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
   * @returns Promise{<object>}
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
   * Create double opt in token with active status.
   *
   * @param {object} params
   * @param {number} params.entityId
   * @param {string} params.kind
   * @param {string} params.token
   *
   * @returns {Promise<Request<KMS.EncryptResponse, AWSError>|*|any|ArrayBuffer>}
   */
  async createDoubleOptInToken(params) {
    const oThis = this;

    const entityId = params.entityId;
    const kind = params.kind;
    const token = params.token;

    const insertResponse = await oThis
      .insert({
        entity_id: entityId,
        kind: temporaryTokenConstants.invertedKinds[kind],
        token: token,
        status: temporaryTokenConstants.invertedStatuses[temporaryTokenConstants.activeStatus]
      })
      .fire();

    if (!insertResponse) {
      return Promise.reject(new Error('Error while inserting data into temporary_tokens table.'));
    }

    const doubleOptInTokenStr = `${insertResponse.insertId.toString()}:${token}`;

    return localCipher.encrypt(coreConstants.PA_EMAIL_TOKENS_DECRIPTOR_KEY, doubleOptInTokenStr);
  }
}

module.exports = TemporaryTokenModel;
