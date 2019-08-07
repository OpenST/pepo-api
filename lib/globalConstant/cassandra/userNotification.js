const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

/**
 * Class for user notification constants.
 *
 * @class UserNotificationConstants
 */
class UserNotificationConstants {
  get profileTxSendSuccessKind() {
    return 'ProfileTxSendSuccess';
  }

  get profileTxReceiveSuccessKind() {
    return 'profileTxReceiveSuccess';
  }

  get videoTxSendSuccessKind() {
    return 'videoTxSendSuccess';
  }

  get videoTxReceiveSuccessKind() {
    return 'videoTxReceiveSuccess';
  }

  get videoAddKind() {
    return 'videoAdd';
  }

  get contributionThanksKind() {
    return 'contributionThanks';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.profileTxSendSuccessKind,
      '2': oThis.profileTxReceiveSuccessKind,
      '3': oThis.videoTxSendSuccessKind,
      '4': oThis.videoTxReceiveSuccessKind,
      '5': oThis.videoAddKind,
      '6': oThis.contributionThanksKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds ? invertedKinds : util.invert(oThis.kinds);

    return invertedKinds;
  }
}

module.exports = new UserNotificationConstants();
