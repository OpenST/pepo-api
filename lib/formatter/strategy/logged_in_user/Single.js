const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser');

/**
 * Class for logged in user formatter.
 *
 * @class LoggedInUserFormatter
 */
class LoggedInUserFormatter extends BaseFormatter {
  /**
   * Constructor for logged in user formatter.
   *
   * @param {object} params
   * @param {object} params.user
   * @param {object} params.tokenUser
   * @param {object} params.airdropDetails
   *
   * @param {number} params.user.id
   * @param {number} params.user.updatedAt
   *
   * @param {array<string>} params.tokenUser.properties
   * @param {number} params.tokenUser.updatedAt
   *
   * @param {string} params.airdropDetails.pepoAmountInWei
   * @param {string} params.airdropDetails.pepoAmountInDollar
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.user = params.user;
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

    const userKeyConfig = {
      id: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    const userValidationResponse = oThis.validateParameters(oThis.user, userKeyConfig);

    if (userValidationResponse.isFailure()) {
      return userValidationResponse;
    }

    const tokenUserKeyConfig = {
      properties: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    const tokenUserValidationResponse = oThis.validateParameters(oThis.tokenUser, tokenUserKeyConfig);
    if (tokenUserValidationResponse.isFailure()) {
      return userValidationResponse;
    }

    const aidropDetailsKeyConfig = {
      pepoAmountInWei: { isNullAllowed: false },
      pepoAmountInDollar: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.airdropDetails, aidropDetailsKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    const uts = oThis.user.updatedAt > oThis.tokenUser.updatedAt ? oThis.user.updatedAt : oThis.tokenUser.updatedAt;

    const signUpAirdropStatus = oThis._getSignupAirdropStatus();

    const finalResponse = {
      id: Number(oThis.user.id),
      uts: Number(uts),
      signup_airdrop_status: signUpAirdropStatus,
      user_id: Number(oThis.user.id)
    };

    if (!signUpAirdropStatus) {
      finalResponse.pepo_amount_in_wei = oThis.airdropDetails.pepoAmountInWei;
      finalResponse.pepo_amount_in_dollar = oThis.airdropDetails.pepoAmountInDollar;
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

module.exports = LoggedInUserFormatter;
