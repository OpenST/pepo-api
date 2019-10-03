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

  get ostWebhookJobTopic() {
    return 'bg.p1.ostWebhookJob';
  }

  get pepoMobileEventTopic() {
    return 'bg.p1.pepoMobileEvent';
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

  get tweetJobTopic() {
    return 'bg.p1.tweet';
  }

  get eventJobTopic() {
    return 'bg.p1.eventJob';
  }

  get afterRedemptionJobTopic() {
    return 'bg.p1.afterRedemptionJob';
  }
  // Topics / topics end.
}

module.exports = new BgJob();
