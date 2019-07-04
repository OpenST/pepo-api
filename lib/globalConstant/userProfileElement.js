const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds = null;

class UserProfileElement {
  get coverImageKind() {
    return 'COVER_IMAGE';
  }

  get videoPosterImageKind() {
    return 'VIDEO_POSTER_IMAGE';
  }

  get coverVideoKind() {
    return 'COVER_VIDEO';
  }

  get bioKind() {
    return 'BIO';
  }

  get linkKind() {
    return 'LINK';
  }

  get profileImage() {
    return 'PROFILE_IMAGE';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.coverImageKind,
      '2': oThis.videoPosterImageKind,
      '3': oThis.coverVideoKind,
      '4': oThis.bioKind,
      '5': oThis.linkKind,
      '6': oThis.profileImage
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
