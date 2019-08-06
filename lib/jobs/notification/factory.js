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
      case notificationJobConstants.profileTxSendSuccess: {
        return new oThis._profileTransactionSendSuccess(messageParams.message.payload);
      }
      default: {
        throw new Error(`Unrecognized messageParams: ${JSON.stringify(messageParams)}`);
      }
    }
  }

  get _profileTransactionSendSuccess() {
    return require(rootPrefix + '/lib/jobs/notification/ProfileTransactionSendSuccess');
  }
}

module.exports = new Factory();
