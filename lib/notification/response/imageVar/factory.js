const rootPrefix = '../../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  imageVarConstants = require(rootPrefix + '/lib/globalConstant/imageVar');

/**
 * Class for background job processor factory.
 *
 * @class Factory
 */
class Factory {
  /**
   * Get factory instance.
   *
   * @param {String} imageVar
   */
  getInstance(imageVar, initParams) {
    const oThis = this;

    logger.log('Factory get instance.');

    switch (imageVar) {
      case imageVarConstants.subjectImage: {
        return new oThis._subjectImageClass(initParams);
      }
      case imageVarConstants.actorImage: {
        return new oThis._actorImageClass(initParams);
      }
      default: {
        throw new Error(`Unrecognized imageVar: ${imageVar}`);
      }
    }
  }

  get _subjectImageClass() {
    return require(rootPrefix + '/lib/notification/response/imageVar/subjectImage');
  }

  get _actorImageClass() {
    return require(rootPrefix + '/lib/notification/response/imageVar/actorImage');
  }
}

module.exports = new Factory();
