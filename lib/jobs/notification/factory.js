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
      case notificationJobConstants.recoveryInitiate: {
        return new oThis._recoveryInitiateEvent(messageParams.message.payload);
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

  get _contributionThanksEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/ContributionThanks');
  }

  get _airdropDoneEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/AirdropDone');
  }

  get _recoveryInitiateEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/RecoveryInitiate');
  }
}

module.exports = new Factory();
