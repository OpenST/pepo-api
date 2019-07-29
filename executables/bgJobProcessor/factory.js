const rootPrefix = '../..',
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

    if (messageParams.message.kind === bgJobConstants.afterSignUpJobTopic) {
      return new oThis._afterSignupJobProcessor(messageParams.message.payload);
    } else if (messageParams.message.kind === bgJobConstants.twitterFriendsSyncJobTopic) {
      return new oThis._twitterFriendsSyncJobProcessor(messageParams.message.payload);
    } else if (messageParams.message.kind === bgJobConstants.imageResizer) {
      return new oThis._imageResizer(messageParams.message.payload);
    } else if (messageParams.message.kind === bgJobConstants.ostWebhookJobTopic) {
      return new oThis._ostWebhookJobTopic(messageParams.message.payload);
    }
    throw new Error(`Unrecognized messageParams: ${JSON.stringify(messageParams)}`);
  }

  get _afterSignupJobProcessor() {
    return require(rootPrefix + '/executables/bgJobProcessor/AfterSignUpJob');
  }

  get _twitterFriendsSyncJobProcessor() {
    return require(rootPrefix + '/lib/twitterFriendSync/Start');
  }

  get _imageResizer() {
    return require(rootPrefix + '/lib/resize/Image');
  }

  get _ostWebhookJobTopic() {
    return require(rootPrefix + '/app/services/ostEvents/Process');
  }
}

module.exports = new Factory();
