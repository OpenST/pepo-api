const rootPrefix = '../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob');

/**
 * Class for background job processor factory.
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
      case bgJobConstants.afterSignUpJobTopic: {
        return new oThis._afterSignupJobProcessor(messageParams.message.payload);
      }
      case bgJobConstants.twitterFriendsSyncJobTopic: {
        return new oThis._twitterFriendsSyncJobProcessor(messageParams.message.payload);
      }
      case bgJobConstants.imageResizer: {
        return new oThis._imageResizer(messageParams.message.payload);
      }
      case bgJobConstants.videoResizer: {
        return new oThis._videoResizer(messageParams.message.payload);
      }
      case bgJobConstants.ostWebhookJobTopic: {
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
    return require(rootPrefix + '/lib/resize/Image');
  }

  get _videoResizer() {
    return require(rootPrefix + '/lib/resize/Video');
  }

  get _ostWebhookJobTopic() {
    return require(rootPrefix + '/app/services/ostEvents/Process');
  }
}

module.exports = new Factory();
