const rootPrefix = '../../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  headingVarConstants = require(rootPrefix + '/lib/globalConstant/headingVar');

/**
 * Factory Class for Heading Var in Notification.
 *
 * @class Factory
 */
class Factory {
  /**
   * Get factory instance.
   *
   * @param {String} headingVar
   */
  getInstance(headingVar) {
    const oThis = this;

    logger.log('Factory get instance.');

    switch (headingVar) {
      case headingVarConstants.subjectUsername: {
        return new oThis._subjectUsernameClass();
      }
      case headingVarConstants.actorUsername: {
        return new oThis._actorUsernameClass();
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
