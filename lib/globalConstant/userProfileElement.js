const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds = null;

class UserProfileElement {
  get coverImageIdKind() {
    return 'coverImageId';
  }

  get coverVideoIdKind() {
    return 'coverVideoId';
  }

  get bioKind() {
    return 'BIO';
  }

  get linkIdKind() {
    return 'linkId';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.coverImageIdKind,
      '2': oThis.coverVideoIdKind,
      '3': oThis.bioKind,
      '4': oThis.linkIdKind
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
