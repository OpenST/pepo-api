const rootPrefix = '../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  bgJobConstant = require(rootPrefix + '/lib/globalConstant/bgJob');

class Factory {
  getInstance(messageParams) {
    const oThis = this;

    logger.log('Factory get instance.');

    if (messageParams.message.kind === bgJobConstant.afterSignUpJobTopic) {
      return new oThis._afterSignupJobProcessor(messageParams.message.payload);
    } else if (messageParams.message.kind === bgJobConstant.twitterFriendsSyncJobTopic) {
      return new oThis._twitterFriendsSyncJobProcessor(messageParams.message.payload);
    } else if (messageParams.message.kind === bgJobConstant.imageResizer) {
      return new oThis._imageResizer(messageParams.message.payload);
    } else if (messageParams.message.kind === bgJobConstant.ostWebhookJobTopic) {
      return new oThis._ostWebhookJobTopic(messageParams.message.payload);
    } else {
      throw new Error('unrecognized messageParams: ' + JSON.stringify(messageParams));
    }
  }

  get _afterSignupJobProcessor() {
    return require(rootPrefix + '/executables/bgJobProcessor/AfterSignUpJob');
  }

  get _twitterFriendsSyncJobProcessor() {
    return require(rootPrefix + '/lib/twitterFriendSync/Start');
  }

  get _imageResizer() {
    return require(rootPrefix + '/lib/resize/image');
  }

  get _ostWebhookJobTopic() {
    return require(rootPrefix + '/app/services/ostEvents/Process');
  }
}

module.exports = new Factory();
