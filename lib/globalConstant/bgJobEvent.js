class BgJobEvent {
  // bgJob eventJob kinds start.
  get profileTxSendSuccessEventKind() {
    return 'PROFILE_TX_SEND_SUCCESS';
  }

  get profileTxReceiveSuccessEventKind() {
    return 'PROFILE_TX_RECEIVE_SUCCESS';
  }

  get videoTxSendSuccessEventKind() {
    return 'VIDEO_TX_SEND_SUCCESS';
  }

  get videoTxReceiveSuccessEventKind() {
    return 'VIDEO_TX_RECEIVE_SUCCESS';
  }

  get videoAddEventKind() {
    return 'VIDEO_ADD';
  }

  get contributionThanksEventKind() {
    return 'CONTRIBUTION_THANKS';
  }

  get profileTxSendFailureEventKind() {
    return 'PROFILE_TX_SEND_FAILURE';
  }

  get videoTxSendFailureEventKind() {
    return 'VIDEO_TX_SEND_FAILURE';
  }
  // bgJob eventJob kinds end.
}

module.exports = new BgJobEvent();
