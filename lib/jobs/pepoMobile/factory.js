const rootPrefix = '../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  pepoMobileEventConstants = require(rootPrefix + '/lib/globalConstant/pepoMobileEvent');

/**
 * Class for Pepo Mobile Events job processor factory.
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

    logger.log('Pepo Mobile Events job factory get instance.', messageParams);

    switch (messageParams.message.kind) {
      case pepoMobileEventConstants.videoPlayStart: {
        return new oThis._videoPlayStartJob(messageParams);
      }
      default: {
        throw new Error(`Unrecognized messageParams from event factory: ${JSON.stringify(messageParams)}`);
      }
    }
  }

  get _videoPlayStartJob() {
    return require(rootPrefix + '/lib/jobs/pepoMobile/VideoPlayStart');
  }
}

module.exports = new Factory();
