const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

/**
 * Class for video tag constants.
 *
 * @class VideoTag
 */
class VideoTag {
  get postKind() {
    return 'POST';
  }

  get replyKind() {
    return 'REPLY';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.postKind,
      '2': oThis.replyKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds || util.invert(oThis.kinds);

    return invertedKinds;
  }

  get postCacheKeyKind() {
    return 'po';
  }

  get replyCacheKeyKind() {
    return 'rp';
  }

  get allCacheKeyKind() {
    return 'all';
  }
}

module.exports = new VideoTag();
