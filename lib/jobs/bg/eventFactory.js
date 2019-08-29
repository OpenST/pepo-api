const rootPrefix = '../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  bgJobEventConstants = require(rootPrefix + '/lib/globalConstant/bgJobEvent');

/**
 * Class for EventFactory job.
 *
 * @class EventFactory
 */
class EventFactory {
  /**
   * Get factory instance.
   *
   * @param {object} messageParams
   */
  getInstance(messageParams) {
    const oThis = this;

    logger.log('Background job factory get instance from event factory', messageParams);

    switch (messageParams.eventKind) {
      case bgJobEventConstants.profileTxSendSuccessEventKind: {
        return new oThis._profileTxSendSuccessEvent(messageParams.eventPayload);
      }
      case bgJobEventConstants.profileTxReceiveSuccessEventKind: {
        return new oThis._profileTxReceiveSuccessEvent(messageParams.eventPayload);
      }
      case bgJobEventConstants.videoTxSendSuccessEventKind: {
        return new oThis._videoTxSendSuccessEvent(messageParams.eventPayload);
      }
      case bgJobEventConstants.videoTxReceiveSuccessEventKind: {
        return new oThis._videoTxReceiveSuccessEvent(messageParams.eventPayload);
      }
      case bgJobEventConstants.videoAddEventKind: {
        return new oThis._videoAddEvent(messageParams.eventPayload);
      }
      case bgJobEventConstants.contributionThanksEventKind: {
        return new oThis._contributionThanksEvent(messageParams.eventPayload);
      }
      case bgJobEventConstants.profileTxSendFailureEventKind: {
        return new oThis._profileTxSendFailureEvent(messageParams.eventPayload);
      }
      case bgJobEventConstants.videoTxSendFailureEventKind: {
        return new oThis._videoTxSendFailureEvent(messageParams.eventPayload);
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
}

module.exports = new EventFactory();
