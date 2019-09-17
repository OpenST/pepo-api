const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

let invertedShareKinds;

/**
 * Class for for share entity constants.
 *
 * @class ShareEntity
 */
class ShareEntity {
  // Share url start.
  get inviteShareUrl() {
    return coreConstants.PA_DOMAIN + '/?invite=';
  }
  // Share url end.

  // Share kinds start.
  get videoShareKind() {
    return 'VIDEO';
  }

  get inviteShareKind() {
    return 'INVITE';
  }
  // Share kinds end.

  get shareKinds() {
    const oThis = this;

    return {
      '1': oThis.videoShareGotoKind,
      '2': oThis.addEmailScreenGotoKind
    };
  }

  get invertedShareKinds() {
    const oThis = this;

    if (invertedShareKinds) {
      return invertedShareKinds;
    }

    invertedShareKinds = util.invert(oThis.shareKinds);

    return invertedShareKinds;
  }
}

module.exports = new ShareEntity();
