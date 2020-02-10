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

    switch (headingVar) {
      case headingVarConstants.payloadAmountInEth: {
        return new oThis._payloadAmountInEthClass(initParams);
      }
      case headingVarConstants.payloadAmount: {
        return new oThis._payloadAmountClass(initParams);
      }
      case headingVarConstants.payloadPepocornAmount: {
        return new oThis._payloadPepocornAmountClass(initParams);
      }
      case headingVarConstants.subjectName: {
        return new oThis._subjectNameClass(initParams);
      }
      case headingVarConstants.subjectNamePossessive: {
        return new oThis._subjectNamePossessiveClass(initParams);
      }
      case headingVarConstants.actorName: {
        return new oThis._actorNameClass(initParams);
      }
      case headingVarConstants.actorNamePossessive: {
        return new oThis._actorNamePossessiveClass(initParams);
      }
      case headingVarConstants.thankYouText: {
        return new oThis._thankYouTextPossessiveClass(initParams);
      }
      case headingVarConstants.aggregatedActorCount: {
        return new oThis._aggregatedActorCountClass(initParams);
      }
      case headingVarConstants.dynamicText: {
        return new oThis._dynamicTextClass(initParams);
      }
      case headingVarConstants.channelName: {
        return new oThis._channelNameClass(initParams);
      }
      default: {
        throw new Error(`Unrecognized headingVar: ${headingVar}`);
      }
    }
  }

  get _subjectNameClass() {
    return require(rootPrefix + '/lib/notification/response/headingVar/subjectName');
  }

  get _subjectNamePossessiveClass() {
    return require(rootPrefix + '/lib/notification/response/headingVar/subjectNamePossessive');
  }

  get _actorNameClass() {
    return require(rootPrefix + '/lib/notification/response/headingVar/actorName');
  }

  get _actorNamePossessiveClass() {
    return require(rootPrefix + '/lib/notification/response/headingVar/actorNamePossessive');
  }

  get _thankYouTextPossessiveClass() {
    return require(rootPrefix + '/lib/notification/response/headingVar/thankYouText');
  }

  get _payloadAmountInEthClass() {
    return require(rootPrefix + '/lib/notification/response/headingVar/payloadAmountInEth');
  }

  get _payloadAmountClass() {
    return require(rootPrefix + '/lib/notification/response/headingVar/payloadAmount');
  }

  get _payloadPepocornAmountClass() {
    return require(rootPrefix + '/lib/notification/response/headingVar/payloadPepocornAmount');
  }

  get _aggregatedActorCountClass() {
    return require(rootPrefix + '/lib/notification/response/headingVar/aggregatedActorCount');
  }

  get _dynamicTextClass() {
    return require(rootPrefix + '/lib/notification/response/headingVar/dynamicText');
  }

  get _channelNameClass() {
    return require(rootPrefix + '/lib/notification/response/headingVar/channelName');
  }
}

module.exports = new Factory();
