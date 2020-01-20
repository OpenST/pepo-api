/**
 * Class for webhook pre processor constants.
 *
 * @class WebhookPreProcessorJob
 */
class WebhookPreProcessorJob {
  get videoContributionTopic() {
    return 'wep.p1.videoContribution';
  }

  get videoUpdateTopic() {
    return 'wep.p1.videoUpdate';
  }
}

module.exports = new WebhookPreProcessorJob();
