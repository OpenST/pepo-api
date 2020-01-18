const rootPrefix = '../..';

/**
 * Class for webhookPreProcessor.
 *
 * @class webhookPreProcessor
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
