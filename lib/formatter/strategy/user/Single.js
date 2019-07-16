const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser');

/**
 * Class for user formatter.
 *
 * @class UserFormatter
 */
class UserFormatter extends BaseFormatter {
  /**
   * Constructor for user formatter.
   *
   * @param {object} params
   * @param {object} params.user
   * @param {object} params.tokenUser
   *
   * @param {number} params.user.id
   * @param {string} params.user.firstName
   * @param {string} params.user.lastName
   * @param {array<string>} params.user.properties
   * @param {string} params.user.status
   * @param {number} params.user.profileImageId
   * @param {number} params.user.createdAt
   * @param {number} params.user.updatedAt
   *
   * @param {number} params.tokenUser.id
   * @param {number} params.tokenUser.userId
   * @param {string} params.tokenUser.ostUserId
   * @param {string} params.tokenUser.ostTokenHolderAddress
   * @param {array<string>} params.tokenUser.properties
   * @param {string} params.tokenUser.ostStatus
   * @param {number} params.tokenUser.createdAt
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
      userName: { isNullAllowed: false },
      name: { isNullAllowed: false },
      status: { isNullAllowed: false },
      profileImageId: { isNullAllowed: true },
      updatedAt: { isNullAllowed: false }
    };

    const userValidationResponse = oThis._validateParameters(oThis.user, userKeyConfig);

    if (userValidationResponse.isFailure()) {
      return userValidationResponse;
    }

    const tokenUserKeyConfig = {
      ostUserId: { isNullAllowed: false },
      ostTokenHolderAddress: { isNullAllowed: true },
      ostStatus: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis._validateParameters(oThis.tokenUser, tokenUserKeyConfig);
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
      user_name: oThis.user.userName,
      name: oThis.user.name,
      status: oThis.user.status,
      uts: Number(uts),
      ost_user_id: oThis.tokenUser.ostUserId,
      ost_token_holder_address: oThis.tokenUser.ostTokenHolderAddress || '',
      ost_status: oThis.tokenUser.ostStatus,
      profile_image_id: oThis.user.profileImageId,
      signup_airdrop_status: oThis._getSignupAirdropStatus(oThis.tokenUser)
    });
  }

  /**
   * Get airdrop signup status.
   *
   * @return {number}
   * @private
   */
  _getSignupAirdropStatus(tokenUser) {
    const propertiesArray = new TokenUserModel().getBitwiseArray('properties', tokenUser.properties);
    if (propertiesArray.indexOf(tokenUserConstants.airdropDoneProperty) > -1) {
      return 1;
    }

    return 0;
  }
}

module.exports = UserFormatter;
