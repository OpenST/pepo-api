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
    return 'PROFILE_TX_SEND_SUCCESS';
  }

  get profileTxReceiveSuccessKind() {
    return 'PROFILE_TX_RECEIVE_SUCCESS';
  }

  get videoTxSendSuccessKind() {
    return 'VIDEO_TX_SEND_SUCCESS';
  }

  get videoTxReceiveSuccessKind() {
    return 'VIDEO_TX_RECEIVE_SUCCESS';
  }

  get videoAddKind() {
    return 'VIDEO_ADD';
  }

  get contributionThanksKind() {
    return 'CONTRIBUTION_THANKS';
  }

  get profileTxSendFailureKind() {
    return 'PROFILE_TX_SEND_FAILURE';
  }

  get videoTxSendFailureKind() {
    return 'VIDEO_TX_SEND_FAILURE';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.profileTxSendSuccessKind,
      '2': oThis.profileTxReceiveSuccessKind,
      '3': oThis.videoTxSendSuccessKind,
      '4': oThis.videoTxReceiveSuccessKind,
      '5': oThis.videoAddKind,
      '6': oThis.contributionThanksKind,
      '7': oThis.profileTxSendFailureKind,
      '8': oThis.videoTxSendFailureKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds ? invertedKinds : util.invert(oThis.kinds);

    return invertedKinds;
  }
}

module.exports = new UserNotificationConstants();
