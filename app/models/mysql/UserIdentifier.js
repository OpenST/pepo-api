const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.userDbName;

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
      serviceKind: dbRow.service_kind, // dhananjay - convert to enum
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch by entity kind and value.
   *
   * @param {string} eKind: entity kind
   * @param {string} eValue: entity value
   *
   * @return {object}
   */
  async fetchByKindAndValue(eKind, eValue) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where(['e_kind = ? AND e_value = ?', eKind, eValue])
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }
}

module.exports = UserIdentifier;
