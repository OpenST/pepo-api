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
      case bgJobConstants.videoMergeJobTopic: {
        return new oThis._videoMergeJobProcessor(messageParams.message.payload);
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
      case bgJobConstants.deleteUserJobTopic: {
        return new oThis._deleteUser(messageParams.message.payload);
      }
      case bgJobConstants.deleteUserRepliesJobTopic: {
        return new oThis._deleteUserReplies(messageParams.message.payload);
      }
      case bgJobConstants.tweetJobTopic: {
        return new oThis._tweetByUserId(messageParams.message.payload);
      }
      case bgJobConstants.afterRedemptionJobTopic: {
        return new oThis._afterRedemptionJobProcessor(messageParams.message.payload);
      }
      case bgJobConstants.approveNewCreatorJobTopic: {
        return new oThis._approveNewCreatorJobProcessor(messageParams.message.payload);
      }
      case bgJobConstants.slackContentVideoMonitoringJobTopic: {
        return new oThis._slackContentVideoMonitoringJobProcessor(messageParams.message.payload);
      }
      case bgJobConstants.slackContentReplyMonitoringJobTopic: {
        return new oThis._slackContentReplyMonitoringJobProcessor(messageParams.message.payload);
      }
      case bgJobConstants.verifyThumbnailUploadJobTopic: {
        return new oThis._verifyThumbnailUpload(messageParams.message.payload);
      }
      case bgJobConstants.verifyVideoMergeJobTopic: {
        return new oThis._verifyVideoMerge(messageParams.message.payload);
      }
      case bgJobConstants.postUserApprovalJob: {
        return new oThis._postUserApprovalJob(messageParams.message.payload);
      }
      case bgJobConstants.updateUserDataUsageTopic: {
        return new oThis._updateUserDataUsage(messageParams.message.payload);
      }
      case bgJobConstants.updateChannelDataUsageTopic: {
        return new oThis._updateChannelDataUsage(messageParams.message.payload);
      }
      case bgJobConstants.updateVideosPerformanceUsageTopic: {
        return new oThis._updateVideosPerformanceUsage(messageParams.message.payload);
      }
      case bgJobConstants.updateTagsUsedUsageTopic: {
        return new oThis._updateTagsUsedUsage(messageParams.message.payload);
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
    return require(rootPrefix + '/lib/jobs/bg/resize/sendRequest/Image');
  }

  get _videoResizer() {
    return require(rootPrefix + '/lib/jobs/bg/resize/sendRequest/Video');
  }

  get _videoMergeJobProcessor() {
    return require(rootPrefix + '/lib/jobs/bg/resize/sendRequest/VideoMerge');
  }

  get _checkResizerProgress() {
    return require(rootPrefix + '/lib/jobs/bg/resize/verifyRequest/VerifyProgress');
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

  get _approveNewCreatorJobProcessor() {
    return require(rootPrefix + '/lib/jobs/bg/SlackApproveNewCreatorJobProcessor');
  }

  get _slackContentVideoMonitoringJobProcessor() {
    return require(rootPrefix + '/lib/jobs/bg/SlackContentVideoMonitoringJobProcessor');
  }

  get _slackContentReplyMonitoringJobProcessor() {
    return require(rootPrefix + '/lib/jobs/bg/SlackContentReplyMonitoringJobProcessor');
  }

  get _validatePaymentReceipt() {
    return require(rootPrefix + '/lib/payment/PostProcessReceipt');
  }

  get _deleteUser() {
    return require(rootPrefix + '/lib/user/PostDelete');
  }

  get _deleteUserVideos() {
    return require(rootPrefix + '/lib/video/delete/UserVideos');
  }

  get _deleteUserReplies() {
    return require(rootPrefix + '/lib/video/delete/ReplyVideos');
  }

  get _tweetByUserId() {
    return require(rootPrefix + '/lib/connect/wrappers/twitter/actions/TweetByUserId');
  }

  get _verifyThumbnailUpload() {
    return require(rootPrefix + '/lib/jobs/bg/resize/verifyRequest/VerifyThumbnailUpload');
  }

  get _verifyVideoMerge() {
    return require(rootPrefix + '/lib/jobs/bg/resize/verifyRequest/VerifyVideoMerge');
  }

  get _postUserApprovalJob() {
    return require(rootPrefix + '/lib/jobs/bg/PostUserApprovalJob');
  }

  get _updateUserDataUsage() {
    return require(rootPrefix + '/lib/jobs/bg/updateUsageData/UserData');
  }

  get _updateChannelDataUsage() {
    return require(rootPrefix + '/lib/jobs/bg/updateUsageData/ChannelData');
  }

  get _updateVideosPerformanceUsage() {
    return require(rootPrefix + '/lib/jobs/bg/updateUsageData/VideosPerformance');
  }

  get _updateTagsUsedUsage() {
    return require(rootPrefix + '/lib/jobs/bg/updateUsageData/TagsUsed');
  }
}

module.exports = new Factory();
