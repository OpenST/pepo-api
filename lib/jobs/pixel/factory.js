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
      case pixelJobConstants.approveUserAsCreatorJob: {
        return new oThis._approveUserAsCreatorJob(messageParams.message.payload);
      }
      default: {
        throw new Error(`Unrecognized messageParams: ${JSON.stringify(messageParams)}`);
      }
    }
  }

  get _approveUserAsCreatorJob() {
    return require(rootPrefix + '/lib/jobs/pixel/handler/ApproveUserAsCreator');
  }
}

module.exports = new Factory();
