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

  getInviteShareEntity(url) {
    return {
      message: `Pepo is where the crypto community comes together, with short video updates and tokens of appreciation. It is so fast, so easy to use, you\'ll re-imagine what\'s possible with crypto. ${url}`,
      title: 'Pepo', // Optional.
      subject: 'Meet the people shaping the crypto movement.' // Optional.
    };
  }

  getVideoShareEntity(creatorUserName, url) {
    return {
      message: `🌶️ Checkout ${creatorUserName}'s latest video on Pepo! ${url}`,
      title: 'Pepo', // Optional.
      subject: 'Meet the people shaping the crypto movement.' // Optional.
    };
  }
}
module.exports = new ShareEntity();
