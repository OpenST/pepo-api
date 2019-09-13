const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for invite user single formatter.
 *
 * @class InviteUserSingleFormatter
 */
class InviteUserSingleFormatter extends BaseFormatter {
  /**
   * Constructor for invite user single formatter.
   *
   * @param {object} params
   * @param {object} params.inviteUser
   *
   * @param {number} params.inviteUser.id
   * @param {string} params.inviteUser.handle
   * @param {string} params.inviteUser.email
   * @param {string} params.inviteUser.name
   * @param {string} [params.inviteUser.profileImageUrl]
   * @param {string} params.inviteUser.status
   * @param {string} params.inviteUser.adminStatus
   * @param {string} params.inviteUser.creatorStatus
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.inviteUser = params.inviteUser;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const inviteUserKeyConfig = {
      id: { isNullAllowed: false },
      handle: { isNullAllowed: false },
      email: { isNullAllowed: false },
      name: { isNullAllowed: false },
      profileImageUrl: { isNullAllowed: true },
      status: { isNullAllowed: false },
      invitedUserCount: { isNullAllowed: false },
      adminStatus: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.inviteUser, inviteUserKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    const response = {
      id: oThis.inviteUser.id,
      handle: oThis.inviteUser.handle,
      email: oThis.inviteUser.email,
      name: oThis.inviteUser.name,
      profile_image_url: oThis.inviteUser.profileImageUrl || null,
      status: oThis.inviteUser.status,
      admin_status: oThis.inviteUser.adminStatus,
      creator_status: oThis.inviteUser.creatorStatus,
      invited_user_count: oThis.inviteUser.invitedUserCount,
      updated_at: oThis.inviteUser.updatedAt
    };

    return responseHelper.successWithData(response);
  }
}

module.exports = InviteUserSingleFormatter;
