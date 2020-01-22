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
      eKind: dbRow.e_kind, // dhananjay - convert to enum
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
   * Index name
   *
   * @returns {string}
   */
  static get userIdEmailUniqueIndexName() {
    return 'uidx_1';
  }
}

module.exports = UserIdentifier;
