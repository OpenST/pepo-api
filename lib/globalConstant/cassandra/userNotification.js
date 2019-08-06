const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

/**
 * Class for user notification constants.
 *
 * @class UserNotificationConstants
 */
class UserNotificationConstants {
  get transactionKind() {
    return 'transactionKind';
  }

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
      '1': oThis.transactionKind,
      '2': oThis.profileTxReceiveSuccessKind,
      '3': oThis.videoTxReceiveSuccessKind,
      '4': oThis.profileTxSendSuccessKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds ? invertedKinds : util.invert(oThis.kinds);

    return invertedKinds;
  }
}

module.exports = new UserNotificationConstants();
