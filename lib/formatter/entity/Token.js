/**
 * Formatter for get Token Details to convert keys to snake case.
 *
 * @module lib/formatter/entity/Token
 */

const rootPrefix = '../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for get Token Details formatter.
 *
 * @class
 */
class Token {
  /**
   * Constructor for get Token Details formatter.
   *
   * @param {Object} params
   * @param {Object} params.tokenDetails
   *
   * @param {Number} params.tokenDetails.id
   * @param {String} params.tokenDetails.name
   * @param {String} params.tokenDetails.symbol
   * @param {Number} params.tokenDetails.ostTokenId
   * @param {Number} params.tokenDetails.decimal
   * @param {Number} params.tokenDetails.conversionFactor
   * @param {String} params.tokenDetails.companyTokenHolderAddress
   * @param {String} params.tokenDetails.ruleAddresses
   * @param {Number} params.tokenDetails.ostCompanyUserId
   * @param {Number} params.tokenDetails.createdAt
   * @param {Number} params.tokenDetails.updatedAt
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;
    oThis.params = params;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    const formattedData = {
      id: Number(oThis.params.tokenDetails.id),
      name: oThis.params.tokenDetails.name,
      symbol: oThis.params.tokenDetails.symbol,
      decimal: oThis.params.tokenDetails.decimal,
      ost_token_id: oThis.params.tokenDetails.ostTokenId,
      conversion_factor: oThis.params.tokenDetails.conversionFactor,
      company_token_holder_address: oThis.params.tokenDetails.companyTokenHolderAddress,
      rule_addresses: oThis.params.tokenDetails.ruleAddresses,
      ost_company_user_id: oThis.params.tokenDetails.ostCompanyUserId,
      created_at: oThis.params.tokenDetails.createdAt,
      updated_at: oThis.params.tokenDetails.updatedAt
    };

    return responseHelper.successWithData(formattedData);
  }
}

module.exports = Token;
