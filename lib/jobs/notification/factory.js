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

    logger.log('Factory get instance.');

    switch (messageParams.message.kind) {
      case notificationJobConstants.profileTxSendSuccess: {
        return new oThis._afterSignupJobProcessor(messageParams.message.payload);
      }
      case notificationJobConstants.profileTxReceiveSuccess: {
        return new oThis._twitterFriendsSyncJobProcessor(messageParams.message.payload);
      }
      case notificationJobConstants.videoTxSendSuccess: {
        return new oThis._imageResizer(messageParams.message.payload);
      }
      case notificationJobConstants.videoTxReceiveSuccess: {
        return new oThis._videoResizer(messageParams.message.payload);
      }
      case notificationJobConstants.videoAdd: {
        return new oThis._checkResizerProgress(messageParams.message.payload);
      }
      case notificationJobConstants.contributionThanks: {
        return new oThis._ostWebhookJobTopic(messageParams.message.payload);
      }
      default: {
        throw new Error(`Unrecognized messageParams: ${JSON.stringify(messageParams)}`);
      }
    }
  }

  get _afterSignupJobProcessor() {
    return require(rootPrefix + '/lib/jobs/bg/AfterSignUpJob');
  }

  get _twitterFriendsSyncJobProcessor() {
    return require(rootPrefix + '/lib/jobs/bg/TwitterFriendSyncStart');
  }

  get _imageResizer() {
    return require(rootPrefix + '/lib/jobs/bg/resize/Image');
  }

  get _videoResizer() {
    return require(rootPrefix + '/lib/jobs/bg/resize/Video');
  }

  get _checkResizerProgress() {
    return require(rootPrefix + '/lib/jobs/bg/resize/VerifyProgress');
  }

  get _ostWebhookJobTopic() {
    return require(rootPrefix + '/app/services/ostEvents/Process');
  }
}

module.exports = new Factory();
