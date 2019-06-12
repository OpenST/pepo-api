const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants');
const dbName = 'pepo_api_' + coreConstants.environment;

/**
 * Class for Token model.
 *
 * @class
 */
class Token extends ModelBase {
  /**
   * Token model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'tokens';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {string} dbRow.name
   * @param {string} dbRow.symbol
   * @param {number} dbRow.decimal
   * @param {string} dbRow.ost_token_id
   * @param {string} dbRow.conversion_factor
   * @param {string} dbRow.company_token_holder_address
   * @param {string} dbRow.rule_addresses
   * @param {string} dbRow.api_key
   * @param {string} dbRow.api_secret
   * @param {string} dbRow.encryption_salt
   * @param {string} dbRow.ost_company_user_id
   * @param {string} dbRow.created_at
   * @param {string} dbRow.updated_at
   *
   * @return {object}
   * @private
   */
  _formatDbData(dbRow) {
    return {
      id: dbRow.id,
      name: dbRow.name,
      symbol: dbRow.symbol,
      ostTokenId: dbRow.ost_token_id,
      decimal: dbRow.decimal,
      conversionFactor: dbRow.conversion_factor,
      companyTokenHolderAddress: dbRow.company_token_holder_address,
      ruleAddresses: dbRow.rule_addresses,
      apiKey: dbRow.api_key,
      apiSecret: dbRow.api_secret,
      encryptionSalt: dbRow.encryption_salt,
      ostCompanyUserId: dbRow.ost_company_user_id,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Fetch the first token present in table.
   *
   * @returns {Promise<*>}
   */
  async fetchToken() {
    const oThis = this;

    const dbRow = await oThis.select('*').fire();

    if (dbRow.length === 0) {
      return Promise.reject(new Error(`No entry found in tokens table.`));
    }

    return oThis._formatDbData(dbRow[0]);
  }
}

module.exports = Token;
