const rootPrefix = '../../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  headingVarConstants = require(rootPrefix + '/lib/globalConstant/headingVar');

/**
 * Factory class for heading var in notification.
 *
 * @class Factory
 */
class Factory {
  /**
   * Get factory instance.
   *
   * @param {string} headingVar
   * @param {object} initParams
   */
  getInstance(headingVar, initParams) {
    const oThis = this;

    logger.log('Factory get instance.');

    switch (headingVar) {
      case headingVarConstants.subjectUsername: {
        return new oThis._subjectUsernameClass(initParams);
      }
      case headingVarConstants.actorUsername: {
        return new oThis._actorUsernameClass(initParams);
      }
      default: {
        throw new Error(`Unrecognized headingVar: ${headingVar}`);
      }
    }
  }

  get _subjectUsernameClass() {
    return require(rootPrefix + '/lib/notification/response/headingVar/subjectUsername');
  }

  get _actorUsernameClass() {
    return require(rootPrefix + '/lib/notification/response/headingVar/actorUsername');
  }
}

module.exports = new Factory();
