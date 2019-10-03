const rootPrefix = '../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob');

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

    // switch (messageParams.message.kind) {
    //   case notificationJobConstants.profileTxSendSuccess: {
    //     return new oThis._feedVideoViewEvent(messageParams.message.payload);
    //   }
    //   default: {
    //     throw new Error(`Unrecognized messageParams from event factory: ${JSON.stringify(messageParams)}`);
    //   }
    // }
  }

  // get _feedVideoViewEvent() {
  //   return require(rootPrefix + '/lib/userNotificationPublisher/ProfileTransactionSendSuccess');
  // }
}

module.exports = new Factory();
