const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds = null;

class UserProfileElement {
  get coverImageKind() {
    return 'coverImage';
  }

  get coverVideoKind() {
    return 'coverVideo';
  }

  get bioKind() {
    return 'bio';
  }

  get linkKind() {
    return 'link';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.coverImageKind,
      '2': oThis.coverVideoKind,
      '3': oThis.bioKind,
      '4': oThis.linkKind
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
