const rootPrefix = '../../..',
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
  getInstance(imageVar) {
    const oThis = this;

    logger.log('Factory get instance.');

    switch (imageVar) {
      case imageVarConstants.subjecImage: {
        return new oThis._subjecImageClass();
      }
      case imageVarConstants.actorImage: {
        return new oThis._actorImageClass();
      }
      default: {
        throw new Error(`Unrecognized imageVar: ${imageVar}`);
      }
    }
  }

  get _subjecImageClass() {
    return require(rootPrefix + '/lib/notification/response/imageVar/subjectImage');
  }

  get _actorImageClass() {
    return require(rootPrefix + '/lib/notification/response/imageVar/actorImage');
  }
}

module.exports = new Factory();
