const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
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
   *
   * @param {number} params.user.id
   * @param {number} params.user.updatedAt
   *
   * @param {array<string>} params.tokenUser.properties
   * @param {number} params.tokenUser.updatedAt
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

    return oThis.validateParameters(oThis.tokenUser, tokenUserKeyConfig);
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

    return responseHelper.successWithData({
      id: Number(oThis.user.id),
      uts: Number(uts),
      signup_airdrop_status: oThis._getSignupAirdropStatus(),
      user_id: Number(oThis.user.id)
    });
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
