const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

/**
 * Class for invite code constants
 *
 * @class InviteCodeConstant
 */
class InviteCodeConstant {
  get defaultInviteLimitForNonCreator() {
    return 50;
  }

  get infiniteInviteLimitForNonCreator() {
    return -1;
  }
}

module.exports = new InviteCodeConstant();
