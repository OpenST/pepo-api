const rootPrefix = '../../../..',
  webhookEventConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEvent');

/**
 * Class for webhook event formatter factory.
 *
 * @class Factory
 */
class Factory {
  /**
   * Main performer for class.
   *
   * @param {object} params
   * @param {string} params.webhookEventKind
   * @param {object} params.webhookEndpoint
   *
   * @returns {*}
   */
  perform(params) {
    const oThis = this;

    switch (params.webhookEventKind) {
      case webhookEventConstants.videoUpdateTopicKind: {
        return oThis._videoUpdateFormatter.perform(params);
      }

      case webhookEventConstants.videoContributionTopicKind: {
        return oThis._videoContributionFormatter.perform(params);
      }

      default: {
        throw new Error('Undefined webhook event kind');
      }
    }
  }

  get _videoUpdateFormatter() {
    return require(rootPrefix + '/lib/webhook/formatter/v1/videoUpdate');
  }

  get _videoContributionFormatter() {
    return require(rootPrefix + '/lib/webhook/formatter/v1/videoContribution');
  }
}

module.exports = new Factory();
