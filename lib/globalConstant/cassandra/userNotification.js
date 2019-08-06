const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

/**
 * Class for user notification constants.
 *
 * @class UserNotificationConstants
 */
class UserNotificationConstants {
  get profileTxReceiveSuccessKind() {
    return 'profileTxReceiveSuccessKind';
  }

  get videoTxReceiveSuccessKind() {
    return 'videoTxReceiveSuccessKind';
  }

  get profileTxSendSuccessKind() {
    return 'profileTxSendSuccess';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.profileTxReceiveSuccessKind,
      '2': oThis.videoTxReceiveSuccessKind,
      '3': oThis.profileTxSendSuccessKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds ? invertedKinds : util.invert(oThis.kinds);

    return invertedKinds;
  }
}

module.exports = new UserNotificationConstants();
