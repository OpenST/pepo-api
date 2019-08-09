const rootPrefix = '../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob');

/**
 * Class for notification job processor factory.
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

    logger.log('Factory get instance.');

    switch (messageParams.message.kind) {
      case notificationJobConstants.profileTxSendSuccess:
      case notificationJobConstants.profileTxReceiveSuccess: {
        return new oThis._notificationKindSubscriber(messageParams.message.payload);
      }
      default: {
        throw new Error(`Unrecognized messageParams: ${JSON.stringify(messageParams)}`);
      }
    }
  }

  get _notificationKindSubscriber() {
    return require(rootPrefix + '/lib/jobs/notification/Subscriber');
  }
}

module.exports = new Factory();
