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
   * Main performer for class.
   *
   * @param {object} params
   * @param {object} params.webhookEvent
   * @param {object} params.webhookEndpoint
   */
  perform(params) {
    const oThis = this;

    logger.log('Webhook processor factory. Input: ', params);

    const webhookEvent = params.webhookEvent;

    switch (webhookEvent.topicKind) {
      case webhookEventConstants.videoContributionTopicKind: {
        return new oThis._videoContributionProcessor(params);
      }
      case webhookEventConstants.videoUpdateTopicKind: {
        return new oThis._videoUpdateProcessor(params);
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
