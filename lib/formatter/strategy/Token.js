const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for get Token Details formatter.
 *
 * @class Token
 */
class Token extends BaseFormatter {
  /**
   * Constructor for get Token Details formatter.
   *
   * @param {object} params
   * @param {object} params.tokenDetails
   *
   * @param {number} params.tokenDetails.id
   * @param {string} params.tokenDetails.name
   * @param {string} params.tokenDetails.symbol
   * @param {number} params.tokenDetails.ostTokenId
   * @param {number} params.tokenDetails.decimal
   * @param {number} params.tokenDetails.conversionFactor
   * @param {string} params.tokenDetails.companyTokenHolderAddress
   * @param {string} params.tokenDetails.ruleAddresses
   * @param {number} params.tokenDetails.ostCompanyUserId
   * @param {number} params.tokenDetails.createdAt
   * @param {number} params.tokenDetails.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.tokenDetails = params.tokenDetails;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const tokenDetailsKeyConfig = {
      id: { isNullAllowed: false },
      name: { isNullAllowed: false },
      symbol: { isNullAllowed: false },
      decimal: { isNullAllowed: false },
      ostTokenId: { isNullAllowed: false },
      conversionFactor: { isNullAllowed: false },
      companyTokenHolderAddress: { isNullAllowed: false },
      ruleAddresses: { isNullAllowed: false },
      ostCompanyUserId: { isNullAllowed: false },
      createdAt: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.tokenDetails, tokenDetailsKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result|*}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: Number(oThis.tokenDetails.id),
      name: oThis.tokenDetails.name,
      symbol: oThis.tokenDetails.symbol,
      decimal: Number(oThis.tokenDetails.decimal),
      ost_token_id: Number(oThis.tokenDetails.ostTokenId),
      conversion_factor: oThis.tokenDetails.conversionFactor,
      company_token_holder_address: oThis.tokenDetails.companyTokenHolderAddress,
      rule_addresses: oThis.tokenDetails.ruleAddresses,
      ost_company_user_id: oThis.tokenDetails.ostCompanyUserId,
      created_at: Number(oThis.tokenDetails.createdAt),
      uts: Number(oThis.tokenDetails.updatedAt)
    });
  }
}

module.exports = Token;
