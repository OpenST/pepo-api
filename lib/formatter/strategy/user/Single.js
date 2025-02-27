const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

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
   * @param {integer} params.userId
   * @param {object} params.user
   * @param {object} params.tokenUser
   * @param {object} params.sanitizedRequestHeaders
   *
   * @param {number} params.user.id
   * @param {string} params.user.userName
   * @param {string} params.user.name
   * @param {string} params.user.status
   * @param {boolean} params.user.approvedCreator
   * @param {boolean} params.user.isUserGlobalMuted
   * @param {number} params.user.profileImageId
   * @param {number} params.user.createdAt
   * @param {number} params.user.updatedAt
   *
   * @param {number} params.tokenUser.id
   * @param {number} params.tokenUser.userId
   * @param {string} params.tokenUser.ostUserId
   * @param {string} params.tokenUser.ostTokenHolderAddress
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

    oThis.userId = params.userId;
    oThis.user = params.user;
    oThis.tokenUser = params.tokenUser;
    oThis.requestHeaders = params.sanitizedRequestHeaders;
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
      approvedCreator: { isNullAllowed: false },
      isUserGlobalMuted: { isNullAllowed: false },
      profileImageId: { isNullAllowed: true },
      updatedAt: { isNullAllowed: false }
    };

    const userValidationResponse = oThis.validateParameters(oThis.user, userKeyConfig);

    if (userValidationResponse.isFailure()) {
      logger.error(
        'user validation failed in formatter-----',
        '\nuserId: ',
        oThis.userId,
        '\n-oThis.user----> ',
        oThis.user
      );

      return userValidationResponse;
    }

    const tokenUserKeyConfig = {
      ostUserId: { isNullAllowed: false },
      ostTokenHolderAddress: { isNullAllowed: true },
      ostStatus: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    const tokenUserValidationResponse = oThis.validateParameters(oThis.tokenUser, tokenUserKeyConfig);
    if (tokenUserValidationResponse.isFailure()) {
      logger.error(
        'TokenUser validation failed in formatter-----',
        '\nuserId: ',
        oThis.userId,
        '\n-oThis.tokenUser----> ',
        oThis.tokenUser
      );
    }

    return tokenUserValidationResponse;
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
      approved_creator: oThis._isApprovedCreator(),
      uts: Number(uts),
      ost_user_id: oThis.tokenUser.ostUserId,
      ost_token_holder_address: oThis.tokenUser.ostTokenHolderAddress || '',
      ost_status: oThis.tokenUser.ostStatus,
      profile_image_id: oThis.user.profileImageId,
      is_managing_any_channel: oThis.user.isManagingAnyChannel ? 1 : 0
    });
  }

  /**
   * Is user approved creator?
   *
   * @returns {boolean|number|*}
   * @private
   */
  _isApprovedCreator() {
    const oThis = this;

    return oThis.user.approvedCreator ? 1 : 0;
  }
}

module.exports = UserFormatter;
