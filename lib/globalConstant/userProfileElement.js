const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds = null;

class UserProfileElement {
  get profileImageIdKind() {
    return 'profileImageId';
  }

  get coverImageIdKind() {
    return 'coverImageId';
  }

  get coverVideoIdKind() {
    return 'coverVideoId';
  }

  get posterImageIdKind() {
    return 'posterImageId';
  }

  get bioIdKind() {
    return 'bioId';
  }

  get linkIdKind() {
    return 'linkId';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.coverImageIdKind,
      '2': oThis.coverVideoIdKind,
      '3': oThis.bioIdKind,
      '4': oThis.linkIdKind,
      '5': oThis.profileImageIdKind,
      '6': oThis.posterImageIdKind
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
