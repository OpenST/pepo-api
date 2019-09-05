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

    logger.log('Heading var factory get instance.');

    switch (headingVar) {
      case headingVarConstants.amount: {
        return new oThis._amountClass(initParams);
      }
      case headingVarConstants.subjectName: {
        return new oThis._subjectNameClass(initParams);
      }
      case headingVarConstants.actorName: {
        return new oThis._actorNameClass(initParams);
      }
      case headingVarConstants.actorNamePossessive: {
        return new oThis._actorNamePossessiveClass(initParams);
      }
      default: {
        throw new Error(`Unrecognized headingVar: ${headingVar}`);
      }
    }
  }

  get _subjectNameClass() {
    return require(rootPrefix + '/lib/notification/response/headingVar/subjectName');
  }

  get _actorNameClass() {
    return require(rootPrefix + '/lib/notification/response/headingVar/actorName');
  }

  get _actorNamePossessiveClass() {
    return require(rootPrefix + '/lib/notification/response/headingVar/actorNamePossessive');
  }

  get _amountClass() {
    return require(rootPrefix + '/lib/notification/response/headingVar/amount');
  }
}

module.exports = new Factory();
