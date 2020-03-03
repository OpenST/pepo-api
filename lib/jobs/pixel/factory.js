const rootPrefix = '../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  pixelJobConstants = require(rootPrefix + '/lib/globalConstant/pixelJob');

/**
 * Class for pixel job processor factory.
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

    logger.log('Pixel job factory get instance.', messageParams);

    switch (messageParams.message.kind) {
      default: {
        throw new Error(`Unrecognized messageParams: ${JSON.stringify(messageParams)}`);
      }
    }
  }
}

module.exports = new Factory();
