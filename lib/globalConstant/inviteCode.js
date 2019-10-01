const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

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

  get userKind() {
    return 'USER';
  }

  get nonUserKind() {
    return 'NON_USER';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.userKind,
      '2': oThis.nonUserKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds ? invertedKinds : util.invert(oThis.kinds);

    return invertedKinds;
  }
}

module.exports = new InviteCode();
