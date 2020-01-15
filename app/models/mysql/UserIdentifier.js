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
}

module.exports = UserIdentifier;
