const rootPrefix = '../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob');

/**
 * Class for notification job processor factory.
 *
 * @class Factory
 */
class Factory {
  /**
   * Get factory instance.
   *
   * @param {object} messageParams
   */
  getInstance(messageParams) {
    const oThis = this;

    logger.log('Notification job factory get instance.', messageParams);

    switch (messageParams.message.kind) {
      case notificationJobConstants.profileTxSendSuccess: {
        return new oThis._profileTxSendSuccessEvent(messageParams.message.payload);
      }
      case notificationJobConstants.profileTxReceiveSuccess: {
        return new oThis._profileTxReceiveSuccessEvent(messageParams.message.payload);
      }
      case notificationJobConstants.videoTxSendSuccess: {
        return new oThis._videoTxSendSuccessEvent(messageParams.message.payload);
      }
      case notificationJobConstants.videoTxReceiveSuccess: {
        return new oThis._videoTxReceiveSuccessEvent(messageParams.message.payload);
      }
      case notificationJobConstants.replyTxSendSuccess: {
        return new oThis._replyTxSendSuccessEvent(messageParams.message.payload);
      }
      case notificationJobConstants.replyTxReceiveSuccess: {
        return new oThis._replyTxReceiveSuccessEvent(messageParams.message.payload);
      }
      case notificationJobConstants.videoNotificationsKind: {
        return new oThis._videoNotificationDelegatorEvent(messageParams.message.payload);
      }
      case notificationJobConstants.replyNotificationsKind: {
        return new oThis._replyNotificationDelegatorEvent(messageParams.message.payload);
      }
      case notificationJobConstants.contributionThanks: {
        return new oThis._contributionThanksEvent(messageParams.message.payload);
      }
      case notificationJobConstants.profileTxSendFailure: {
        return new oThis._profileTxSendFailureEvent(messageParams.message.payload);
      }
      case notificationJobConstants.videoTxSendFailure: {
        return new oThis._videoTxSendFailureEvent(messageParams.message.payload);
      }
      case notificationJobConstants.replyTxSendFailure: {
        return new oThis._replyTxSendFailureEvent(messageParams.message.payload);
      }
      case notificationJobConstants.airdropDone: {
        return new oThis._airdropDoneEvent(messageParams.message.payload);
      }
      case notificationJobConstants.topupDone: {
        return new oThis._topupDoneEvent(messageParams.message.payload);
      }
      case notificationJobConstants.topupFailed: {
        return new oThis._topupFailedEvent(messageParams.message.payload);
      }
      case notificationJobConstants.recoveryInitiate: {
        return new oThis._recoveryInitiateEvent(messageParams.message.payload);
      }
      case notificationJobConstants.paperPlaneTransaction: {
        return new oThis._paperPlaneTransactionEvent(messageParams.message.payload);
      }
      case notificationJobConstants.creditPepocornSuccess: {
        return new oThis._creditPepocornSuccessEvent(messageParams.message.payload);
      }
      case notificationJobConstants.creditPepocornFailure: {
        return new oThis._creditPepocornFailureEvent(messageParams.message.payload);
      }
      case notificationJobConstants.systemNotification: {
        return new oThis._systemNotificationEvent(messageParams.message.payload);
      }
      case notificationJobConstants.channelGoLiveNotificationsKind: {
        return new oThis._channelGoLiveEvent(messageParams.message.payload);
      }
      default: {
        throw new Error(`Unrecognized messageParams from event factory: ${JSON.stringify(messageParams)}`);
      }
    }
  }

  get _profileTxSendSuccessEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/ProfileTransactionSendSuccess');
  }

  get _profileTxReceiveSuccessEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/ProfileTransactionReceiveSuccess');
  }

  get _profileTxSendFailureEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/ProfileTransactionSendFailure');
  }

  get _videoTxSendSuccessEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/VideoTransactionSendSuccess');
  }

  get _replyTxSendSuccessEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/ReplyTransactionSendSuccess');
  }

  get _videoTxSendFailureEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/VideoTransactionSendFailure');
  }

  get _replyTxSendFailureEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/ReplyTransactionSendFailure');
  }

  get _videoTxReceiveSuccessEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/VideoTransactionReceiveSuccess');
  }

  get _replyTxReceiveSuccessEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/ReplyTransactionReceiveSuccess');
  }

  get _videoNotificationDelegatorEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/video/Delegator');
  }

  get _replyNotificationDelegatorEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/reply/Delegator');
  }

  get _contributionThanksEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/ContributionThanks');
  }

  get _airdropDoneEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/AirdropDone');
  }

  get _topupDoneEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/TopupDone');
  }

  get _topupFailedEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/TopupFailed');
  }

  get _recoveryInitiateEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/RecoveryInitiate');
  }

  get _paperPlaneTransactionEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/PaperPlaneTransaction');
  }

  get _creditPepocornSuccessEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/CreditPepocornSuccess');
  }

  get _creditPepocornFailureEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/CreditPepocornFailure');
  }

  get _systemNotificationEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/SystemNotification');
  }

  get _channelGoLiveEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/channel/GoLive');
  }
}

module.exports = new Factory();
