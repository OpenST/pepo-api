const rootPrefix = '../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  webhookPreProcessorJobConstants = require(rootPrefix + '/lib/globalConstant/webhookPreProcessorJob');

/**
 * Class for webhook pre-processor job factory.
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

    logger.log('Webhook pre-processor job factory get instance.', messageParams);

    switch (messageParams.message.kind) {
      case webhookPreProcessorJobConstants.videoContributionTopic: {
        return new oThis._videoContributionJob(messageParams.message.payload);
      }
      case webhookPreProcessorJobConstants.videoUpdateTopic: {
        return new oThis._videoUpdateJob(messageParams.message.payload);
      }
      default: {
        throw new Error(`Unrecognized messageParams from event factory: ${JSON.stringify(messageParams)}`);
      }
    }
  }

  get _videoContributionJob() {
    return require(rootPrefix + '/lib/jobs/webhookPreProcessor/video/VideoContribution');
  }

  get _videoUpdateJob() {
    return require(rootPrefix + '/lib/jobs/webhookPreProcessor/video/VideoUpdate');
  }
}

module.exports = new Factory();
