const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser');

/**
 * Class for airdrop details formatter.
 *
 * @class AirdropDetails
 */
class AirdropDetails extends BaseFormatter {
  /**
   * Constructor for airdrop details formatter.
   *
   * @param {object} params
   * @param {object} params.tokenUser
   * @param {object} params.airdropDetails
   *
   * @param {array<string>} params.tokenUser.properties
   *
   * @param {string} params.airdropDetails.pepoAmountInWei
   * @param {string} params.airdropDetails.pepoAmountInUsd
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.tokenUser = params.tokenUser;
    oThis.airdropDetails = params.airdropDetails;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const tokenUserKeyConfig = {
      properties: { isNullAllowed: false }
    };

    const tokenUserValidationResponse = oThis.validateParameters(oThis.tokenUser, tokenUserKeyConfig);
    if (tokenUserValidationResponse.isFailure()) {
      return tokenUserValidationResponse;
    }

    const aidropDetailsKeyConfig = {
      pepoAmountInWei: { isNullAllowed: false },
      pepoAmountInUsd: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.airdropDetails, aidropDetailsKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object}
   * @private
   */
  _format() {
    const oThis = this;

    const signUpAirdropStatus = oThis._getSignupAirdropStatus();

    let finalResponse = null;
    if (!signUpAirdropStatus) {
      finalResponse = {
        pepo_amount_in_wei: oThis.airdropDetails.pepoAmountInWei,
        pepo_amount_in_usd: oThis.airdropDetails.pepoAmountInUsd
      };
    }

    return responseHelper.successWithData(finalResponse);
  }

  /**
   * Get airdrop signup status.
   *
   * @returns {number}
   * @private
   */
  _getSignupAirdropStatus() {
    const oThis = this;

    const propertiesArray = new TokenUserModel().getBitwiseArray('properties', oThis.tokenUser.properties);

    return propertiesArray.indexOf(tokenUserConstants.airdropDoneProperty) > -1 ? 1 : 0;
  }
}

module.exports = AirdropDetails;
