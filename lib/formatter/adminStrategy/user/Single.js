const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common');

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
      email: { isNullAllowed: true },
      status: { isNullAllowed: false },
      approvedCreator: { isNullAllowed: false },
      profileImageId: { isNullAllowed: true },
      properties: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.user, userKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    let uts;

    if (CommonValidators.isVarNullOrUndefined(oThis.tokenUser.updatedAt)) {
      uts = oThis.user.updatedAt;
    } else {
      uts = oThis.user.updatedAt > oThis.tokenUser.updatedAt ? oThis.user.updatedAt : oThis.tokenUser.updatedAt;
    }

    return responseHelper.successWithData({
      id: Number(oThis.user.id),
      user_name: oThis.user.userName,
      name: oThis.user.name,
      email: oThis.user.email || null,
      status: oThis.user.status,
      approved_creator: oThis.user.approvedCreator,
      uts: Number(uts),
      ost_user_id: oThis.tokenUser.ostUserId || '',
      ost_token_holder_address: oThis.tokenUser.ostTokenHolderAddress || '',
      ost_status: oThis.tokenUser.ostStatus || null,
      profile_image_id: oThis.user.profileImageId,
      properties: new UserModel().getBitwiseArray('properties', oThis.user.properties)
    });
  }
}

module.exports = UserFormatter;
