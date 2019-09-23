const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

let invertedGotoKinds;

/**
 * Class for for goto constants.
 *
 * @class Goto
 */
class Goto {
  // Goto kinds start.
  get videoGotoKind() {
    return 'video';
  }

  get addEmailScreenGotoKind() {
    return 'addEmailScreen';
  }

  get signUpGotoKind() {
    return 'signup';
  }

  get webViewGotoKind() {
    return 'webview';
  }

  get invitedUsersGotoKind() {
    return 'invitedUsers';
  }
  // Share goto kinds end.
}

module.exports = new Goto();
