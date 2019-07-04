const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds = null;

class UserProfileElement {
  get coverImageKind() {
    return 'COVER_IMAGE';
  }

  get coverVideoKind() {
    return 'COVER_VIDEO';
  }

  get bioKind() {
    return 'BIO';
  }

  get urlKind() {
    return 'URL';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.coverImageKind,
      '2': oThis.coverVideoKind,
      '3': oThis.bioKind,
      '4': oThis.urlKind
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
