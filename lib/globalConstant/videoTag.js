const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

/**
 * Class for video tag constants.
 *
 * @class VideoTag
 */
class VideoTag {
  get replyKind() {
    return 'REPLY';
  }

  get postKind() {
    return 'POST';
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

    invertedKinds = invertedKinds ? invertedKinds : util.invert(oThis.kinds);

    return invertedKinds;
  }
}

module.exports = new VideoTag();
