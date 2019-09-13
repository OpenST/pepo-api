const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for get invite code Details formatter.
 *
 * @class InviteCodeSingleFormatter
 */
class InviteCodeSingleFormatter extends BaseFormatter {
  /**
   * Constructor for get invite code Details formatter.
   *
   * @param {object} params
   * @param {object} params.inviteCode
   *
   * @param {number} params.inviteCode.id
   * @param {string} params.inviteCode.code
   * @param {number} params.inviteCode.inviteLimit
   * @param {number} params.inviteCode.invitedUserCount
   * @param {number} params.inviteCode.userId
   * @param {number} params.inviteCode.inviterCodeId
   * @param {number} params.inviteCode.shareId
   * @param {number} params.inviteCode.createdAt
   * @param {number} params.inviteCode.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.inviteCode = params.inviteCode;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const inviteCodeKeyConfig = {
      id: { isNullAllowed: false },
      code: { isNullAllowed: false },
      inviteLimit: { isNullAllowed: false },
      invitedUserCount: { isNullAllowed: false },
      userId: { isNullAllowed: true },
      inviterCodeId: { isNullAllowed: true },
      shareId: { isNullAllowed: false },
      createdAt: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.inviteCode, inviteCodeKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result|*}
   * @private
   */
  _format() {
    const oThis = this;

    let pendingInvites = Number(oThis.inviteCode.inviteLimit) - Number(oThis.inviteCode.invitedUserCount);

    return responseHelper.successWithData({
      id: Number(oThis.inviteCode.id),
      code: oThis.inviteCode.code,
      invite_limit: Number(oThis.inviteCode.inviteLimit),
      invited_user_count: Number(oThis.inviteCode.invitedUserCount),
      user_id: oThis.inviteCode.userId,
      inviter_code_id: oThis.inviteCode.inviterCodeId,
      share_id: oThis.inviteCode.shareId,
      pending_invites: pendingInvites,
      uts: Number(oThis.inviteCode.updatedAt)
    });
  }
}

module.exports = InviteCodeSingleFormatter;
