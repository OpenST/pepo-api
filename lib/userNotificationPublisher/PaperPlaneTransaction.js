const BigNumber = require('bignumber.js');

const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook');

class PaperPlaneTransaction extends UserNotificationPublisherBase {
  /**
   * Constructor for PaperPlaneTransaction.
   *
   * @param {object} params
   * @param {object} params.transaction
   *
   * @augments UserNotificationPublisherBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.transaction = params.transaction;
  }

  /**
   * Async performer.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._setNotificationCentrePayload();

    // Insert into notification_hooks table for hook push notifications.
    await oThis._insertIntoNotificationHook();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize parameters.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    let hasError = false;

    const tx = oThis.transaction;

    logger.log('Start:: Validate for PaperPlaneTransaction');

    if (!CommonValidators.validateNonEmptyObject(tx)) {
      hasError = true;
    }

    if (!hasError && tx.status !== transactionConstants.doneStatus) {
      hasError = true;
    }

    if (!hasError && (!tx.id || !tx.fromUserId || !tx.extraData.toUserIds || tx.extraData.toUserIds.length !== 1)) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_unp_ppt_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { transaction: oThis.transaction }
        })
      );
    }

    logger.log('End:: Validate for PaperPlaneTransaction');
  }

  /**
   * Topic name for the job.
   *
   * @returns {string}
   * @private
   */
  _jobTopic() {
    return notificationJobConstants.recoveryInitiate;
  }

  /**
   * Set payload for notification.
   *
   * @sets oThis.publishUserIds, oThis.payload
   *
   * @returns {Promise<void>}
   * @private
   */
  _setNotificationCentrePayload() {
    const oThis = this;

    logger.log('Start:: _setNotificationCentrePayload for PaperPlaneTransaction');

    oThis.publishUserIds = [oThis.transaction.extraData.toUserIds[0]];

    oThis.payload = {
      actorIds: [oThis.transaction.fromUserId],
      actorCount: 1,
      subjectUserId: oThis.transaction.extraData.toUserIds[0],
      payload: {
        transactionId: oThis.transaction.id,
        amount: oThis.transaction.extraData.amounts[0]
      }
    };

    logger.log('End:: _setNotificationCentrePayload for PaperPlaneTransaction');
  }

  /**
   * Get heading version.
   *
   * @returns {number}
   * @private
   */
  _getHeadingVersion() {
    const oThis = this;
    logger.log('oThis.transaction ======', JSON.stringify(oThis.transaction));

    const amountInBn = new BigNumber(oThis.transaction.extraData.amounts[0]),
      onePepoInBn = new BigNumber('1000000000000000000');

    logger.log('From paper plane transaction.');

    if (amountInBn.gt(onePepoInBn)) {
      oThis.payload.headingVersion = 2;
    } else {
      oThis.payload.headingVersion = 1;
    }
  }

  /**
   * Set notification hook kind.
   *
   * @returns {string}
   * @private
   */
  _notificationHookKind() {
    return notificationHookConstants.paperPlaneTransactionKind;
  }
}

module.exports = PaperPlaneTransaction;
