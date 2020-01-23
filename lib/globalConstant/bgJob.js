/**
 * Class for background job constants.
 *
 * @class BgJob
 */
class BgJob {
  // Topics / topics start.
  get afterSignUpJobTopic() {
    return 'bg.p1.afterSignUpJob';
  }

  get twitterFriendsSyncJobTopic() {
    return 'bg.p1.twitterFriendsSyncJob';
  }

  get imageResizer() {
    return 'bg.p1.imageResizer';
  }

  get videoResizer() {
    return 'bg.p1.videoResizer';
  }

  get checkResizeProgressJobTopic() {
    return 'bg.p1.checkResizeProgress';
  }

  get verifyThumbnailUploadJobTopic() {
    return 'bg.p1.verifyThumbnailUpload';
  }

  get verifyVideoMergeJobTopic() {
    return 'bg.p1.verifyVideoMerge';
  }

  get ostWebhookJobTopic() {
    return 'bg.p1.ostWebhookJob';
  }

  get deleteCassandraJobTopic() {
    return 'bg.p1.deleteCassJob';
  }

  get validatePaymentReceiptJobTopic() {
    return 'bg.p1.validatePaymentReceipt';
  }

  get deleteUserVideosJobTopic() {
    return 'bg.p1.deleteUserVideos';
  }

  get deleteUserRepliesJobTopic() {
    return 'bg.p1.deleteUserReplies';
  }

  get tweetJobTopic() {
    return 'bg.p1.tweet';
  }

  get eventJobTopic() {
    return 'bg.p1.eventJob';
  }

  get afterRedemptionJobTopic() {
    return 'bg.p1.afterRedemptionJob';
  }

  get approveNewCreatorJobTopic() {
    return 'bg.p1.approveNewCreatorJobTopic';
  }

  get slackContentVideoMonitoringJobTopic() {
    return 'bg.p1.slackContentVideoMonitoringJobTopic';
  }

  get videoMergeJobTopic() {
    return 'bg.p1.videoMergeJobTopic';
  }

  get slackContentReplyMonitoringJobTopic() {
    return 'bg.p1.slackContentReplyMonitoringJobTopic';
  }

  get postUserApprovalJob() {
    return 'bg.p1.postUserApprovalJob';
  }

  get updateUserDataUsageTopic() {
    return 'bg.p1.updateUserDataUsageJob';
  }

  get updateVideosPerformanceUsageTopic() {
    return 'bg.p1.updateVideosPerformanceUsageJob';
  }

  get updateTagsUsedUsageTopic() {
    return 'bg.p1.updateTagsUsedUsageJob';
  }

  get cdnCacheInvalidationTopic() {
    return 'cci.p1.cdnCacheInvalidationJob';
  }
  // Topics / topics end.
}

module.exports = new BgJob();
