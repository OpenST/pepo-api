const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds = null;

class UserProfileElement {
  get profileImageKind() {
    return 'profileImage';
  }

  get aboutMeKind() {
    return 'aboutMe';
  }

  get microReasonKind() {
    return 'microReason';
  }

  get goal() {
    return 'goal';
  }

  get kinds() {
    const oThis = this;
    return {
      '1': oThis.profileImageKind,
      '2': oThis.aboutMeKind,
      '3': oThis.microReasonKind,
      '4': oThis.goal
    };
  }

  get invertedKinds() {
    const oThis = this;

    if (invertedKinds) {
      return invertedKinds;
    }

    invertedKinds = util.invert(oThis.kinds);
    return invertedKinds;
  }
}

module.exports = new UserProfileElement();
