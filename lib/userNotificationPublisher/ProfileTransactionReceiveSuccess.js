/**
 * Profile User Transaction Receive Success Publishing
 *
 * @module lib/userNotificationPublisher/ProfileTransactionReceiveSuccess
 */

const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions');

// Declare error config.
const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

/**
 * Constructor for Profile User Transaction Receive Success Publishing
 *
 * @class
 */
class ProfileTransactionReceiveSuccess extends UserNotificationPublisherBase {
  /**
   * Constructor
   *
   * @param {Object} params
   *
   * @constructor
   */
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.transaction = params.transaction;
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._setPayload();

    await oThis._enqueueUserNotification();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and Sanitize parameters.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    let hasError = false;
    let tx = oThis.transaction;

    logger.log('Start:: Validate for ProfileTransactionReceiveSuccess');

    if (!CommonValidators.validateNonEmptyObject(tx)) {
      hasError = true;
    }

    if (!hasError && tx.status !== transactionConstants.successOstTransactionStatus) {
      hasError = true;
    }

    if (!hasError && (!tx.id || !tx.fromUserId || !tx.toUserIds || tx.toUserIds.length != 1)) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_unp_ptrs_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { transaction: oThis.transaction }
        })
      );
    }

    logger.log('End:: Validate for ProfileTransactionReceiveSuccess');
  }

  /**
   * Topic name for the job
   *
   * @return {Promise<void>}
   * @private
   */
  _jobTopic() {
    return notificationJobConstants.profileTxReceiveSuccess;
  }

  /**
   * Set Payload for notification
   *
   * @return {Promise<void>}
   * @private
   */
  _setPayload() {
    const oThis = this;
    logger.log('Start:: _setPayload for ProfileTransactionReceiveSuccess');

    oThis.publishUserIds = [oThis.transaction.toUserIds[0]];

    oThis.payload = {
      actorId: oThis.transaction.fromUserId,
      subjectUserId: oThis.transaction.toUserIds[0],
      transactionId: oThis.transaction.id
    };

    logger.log('End:: _setPayload for ProfileTransactionReceiveSuccess');
  }
}

module.exports = ProfileTransactionReceiveSuccess;
