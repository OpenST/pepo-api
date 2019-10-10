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

    logger.log('Background job factory get instance.', messageParams);

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
      case bgJobConstants.checkResizeProgressJobTopic: {
        return new oThis._checkResizerProgress(messageParams.message.payload);
      }
      case bgJobConstants.ostWebhookJobTopic: {
        return new oThis._ostWebhookJobTopic(messageParams.message.payload);
      }
      case bgJobConstants.deleteCassandraJobTopic: {
        return new oThis._deleteCassandraElements(messageParams.message.payload);
      }
      case bgJobConstants.validatePaymentReceiptJobTopic: {
        return new oThis._validatePaymentReceipt(messageParams.message.payload);
      }
      case bgJobConstants.deleteUserVideosJobTopic: {
        return new oThis._deleteUserVideos(messageParams.message.payload);
      }
      case bgJobConstants.tweetJobTopic: {
        return new oThis._tweetByUserId(messageParams.message.payload);
      }
      case bgJobConstants.afterRedemptionJobTopic: {
        return new oThis._afterRedemptionJobProcessor(messageParams.message.payload);
      }
      case bgJobConstants.verifyThumbnailUploadJobTopic: {
        return new oThis._verifyThumbnailUpload(messageParams.message.payload);
      }
      case bgJobConstants.incrementVideoTagForCreatorJob: {
        return new oThis._incrementVideoTagForCreatorJob(messageParams.message.payload);
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

  get _deleteCassandraElements() {
    return require(rootPrefix + '/lib/jobs/bg/DeleteCassandraElementsJob');
  }

  get _afterRedemptionJobProcessor() {
    return require(rootPrefix + '/lib/jobs/bg/AfterRedemptionJob');
  }

  get _validatePaymentReceipt() {
    return require(rootPrefix + '/lib/payment/PostProcessReceipt');
  }

  get _deleteUserVideos() {
    return require(rootPrefix + '/lib/video/DeleteUserVideos');
  }

  get _tweetByUserId() {
    return require(rootPrefix + '/lib/twitter/actions/TweetByUserId');
  }

  get _verifyThumbnailUpload() {
    return require(rootPrefix + '/lib/jobs/bg/resize/VerifyThumbnailUpload');
  }

  get _incrementVideoTagForCreatorJob() {
    return require(rootPrefix + '/lib/jobs/bg/IncrementVideoTagForCreatorJob');
  }
}

module.exports = new Factory();
