const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic');

/**
 * Class for invite code constants.
 *
 * @class InviteCode
 */
class InviteCode {
  get inviteMaxLimit() {
    return 50;
  }

  get defaultInviteCodeLength() {
    return 6;
  }

  get generateInviteCode() {
    const oThis = this;

    let inviteStringLength = oThis.defaultInviteCodeLength,
      inviteString = basicHelper.getRandomAlphaNumericString().substring(0, inviteStringLength);

    return inviteString.toUpperCase();
  }

  get infiniteInviteLimit() {
    return -1;
  }
}

module.exports = new InviteCode();
