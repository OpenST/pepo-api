const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  userIdentifierConstants = require(rootPrefix + '/lib/globalConstant/userIdentifier'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.socialConnectDbName;

/**
 * Class for user identifier model.
 *
 * @class UserIdentifier
 */
class UserIdentifier extends ModelBase {
  /**
   * Constructor for user identifier model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_identifiers';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.user_id
   * @param {string} dbRow.e_value
   * @param {string} dbRow.e_kind
   * @param {string} dbRow.service_kind
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      userId: dbRow.user_id,
      eValue: dbRow.e_value,
      eKind: userIdentifierConstants.invertedKinds[dbRow.e_kind],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch by entity kind and value.
   *
   * @param {string} eKind: entity kind
   * @param {string} eValues: entity value
   *
   * @return {object}
   */
  async fetchByKindAndValues(eKind, eValues) {
    const oThis = this,
      formattedDbRows = [];

    const dbRows = await oThis
      .select('*')
      .where(['e_kind = ? AND e_value IN (?)', userIdentifierConstants.invertedKinds[eKind], eValues])
      .fire();

    if (dbRows.length > 0) {
      for (let i = 0; i < dbRows.length; i++) {
        formattedDbRows.push(oThis.formatDbData(dbRows[i]));
      }
    }

    return formattedDbRows;
  }

  /**
   * Insert Email of user as unique identifier
   *
   * @param userId
   * @param email
   * @returns {Promise<void>}
   */
  async insertUserEmail(userId, email) {
    const oThis = this;

    await oThis
      .insert({
        user_id: userId,
        e_kind: userIdentifierConstants.invertedKinds[userIdentifierConstants.emailKind],
        e_value: email
      })
      .fire();
  }

  /**
   * Fetch user identifiers by email ids.
   *
   * @param {array<string>} emails
   *
   * @returns {Promise<{}>}
   */
  async fetchUserIdsByEmails(emails) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({
        e_value: emails,
        e_kind: userIdentifierConstants.invertedKinds[userIdentifierConstants.emailKind]
      })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.eValue] = formatDbRow;
    }

    return response;
  }

  /**
   * Fetch by user ids.
   *
   * @param {array<string>} userIds - user ids.
   *
   * @returns {Promise<{}>}
   */
  async fetchByUserIds(userIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({
        user_id: userIds
      })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.userId] = response[formatDbRow.userId] || [];
      response[formatDbRow.userId].push(formatDbRow);
    }

    return response;
  }

  /**
   * Index name
   *
   * @returns {string}
   */
  static get userIdEmailUniqueIndexName() {
    return 'uidx_1';
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.emails) {
      const UserIdentifiersByEmailsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdentifiersByEmails');
      promisesArray.push(new UserIdentifiersByEmailsCache({ emails: params.emails }).clear());
    }
  }
}

module.exports = UserIdentifier;
