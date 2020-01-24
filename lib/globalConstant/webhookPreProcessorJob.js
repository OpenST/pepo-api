/**
 * Class for webhook pre processor constants.
 *
 * @class WebhookPreProcessorJob
 */
class WebhookPreProcessorJob {
  get videoContributionTopic() {
    return 'wepp.p1.videoContribution';
  }

  get videoUpdateTopic() {
    return 'wepp.p1.videoUpdate';
  }
}

module.exports = new WebhookPreProcessorJob();
