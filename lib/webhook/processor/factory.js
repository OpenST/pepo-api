const rootPrefix = '../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  webhookEventConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEvent');

/**
 * Class for webhook processor factory.
 *
 * @class Factory
 */
class Factory {
  /**
   * Get factory instance.
   *
   * @param {object} params
   * @param {object} params.webhook_event
   * @param {object} params.webhook_endpoint
   */
  getInstance(params) {
    const oThis = this;

    logger.log('Webhook processor factory get instance.', params);

    const webhookEvent = params.webhook_event;

    switch (webhookEvent.topicKind) {
      case webhookEventConstants.videoContributionTopicKind: {
        return new oThis._videoContributionProcessor(params);
      }
      case webhookEventConstants.videoUpdateTopicKind: {
        return new oThis._videoUpdateProcessor(params.message.payload);
      }
      default: {
        throw new Error(`Unrecognized messageParams: ${JSON.stringify(params)}`);
      }
    }
  }

  get _videoContributionProcessor() {
    return require(rootPrefix + '/lib/webhook/processor/VideoContribution');
  }

  get _videoUpdateProcessor() {
    return require(rootPrefix + '/lib/webhook/processor/VideoUpdate');
  }
}

module.exports = new Factory();
