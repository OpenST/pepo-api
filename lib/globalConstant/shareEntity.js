const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

/**
 * Class for for share entity constants.
 *
 * @class
 */
class ShareEntity {
  /**
   * Constructor for share entity constants.
   *
   * @constructor
   */
  constructor() {}

  // Share kinds start.
  get videoShareKind() {
    return 'VIDEO';
  }

  get inviteShareKind() {
    return 'INVITE';
  }
  // Share kinds end.

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.videoShareKind,
      '2': oThis.inviteShareKind
    };
  }

  get invertedStatuses() {
    const oThis = this;

    if (invertedKinds) {
      return invertedKinds;
    }

    invertedKinds = util.invert(oThis.kinds);

    return invertedKinds;
  }
}

module.exports = new ShareEntity();
