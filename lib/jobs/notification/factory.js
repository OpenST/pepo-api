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
      case notificationJobConstants.videoAdd: {
        return new oThis._videoAddEvent(messageParams.message.payload);
      }
      case notificationJobConstants.userMention: {
        return new oThis._userMentionEvent(messageParams.message.payload);
      }
      case notificationJobConstants.replyUserMention: {
        return new oThis._replyUserMentionEvent(messageParams.message.payload);
      }
      case notificationJobConstants.replySenderWithAmount: {
        return new oThis._replySenderWithAmount(messageParams.message.payload);
      }
      case notificationJobConstants.replySenderWithoutAmount: {
        return new oThis._replySenderWithoutAmount(messageParams.message.payload);
      }
      case notificationJobConstants.replyReceiverWithAmount: {
        return new oThis._replyReceiverWithAmount(messageParams.message.payload);
      }
      case notificationJobConstants.replyReceiverWithoutAmount: {
        return new oThis._replyReceiverWithoutAmount(messageParams.message.payload);
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
      case notificationJobConstants.dynamicText: {
        return new oThis._dynamicTextEvent(messageParams.message.payload);
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

  get _videoTxSendFailureEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/VideoTransactionSendFailure');
  }

  get _videoTxReceiveSuccessEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/VideoTransactionReceiveSuccess');
  }

  get _videoAddEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/VideoAdd');
  }

  get _userMentionEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/UserMention');
  }

  get _replyUserMentionEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/ReplyUserMention');
  }

  get _replySenderWithAmount() {
    return require(rootPrefix + '/lib/userNotificationPublisher/ReplySenderWithAmount');
  }

  get _replySenderWithoutAmount() {
    return require(rootPrefix + '/lib/userNotificationPublisher/ReplySenderWithoutAmount');
  }

  get _replyReceiverWithAmount() {
    return require(rootPrefix + '/lib/userNotificationPublisher/ReplyReceiverWithAmount');
  }

  get _replyReceiverWithoutAmount() {
    return require(rootPrefix + '/lib/userNotificationPublisher/ReplyReceiverWithoutAmount');
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

  get _dynamicTextEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/DynamicText');
  }
}

module.exports = new Factory();
