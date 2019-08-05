/**
 * Profile User Transaction Send Success Publishing
 *
 * @module lib/userNotificationPublisher/ProfileTransactionSendSuccess
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
 * Constructor for Profile User Transaction Send Success Publishing
 *
 * @class
 */
class ProfileTransactionSendSuccess extends UserNotificationPublisherBase {
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

    logger.log('Start:: Validate for ProfileTransactionSendSuccess');

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
          internal_error_identifier: 'l_unp_ptss_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { transaction: oThis.transaction }
        })
      );
    }

    logger.log('End:: Validate for ProfileTransactionSendSuccess');
  }

  /**
   * Topic name for the job
   *
   * @return {Promise<void>}
   * @private
   */
  _jobTopic() {
    return notificationJobConstants.profileTxSendSuccess;
  }

  /**
   * Set Payload for notification
   *
   * @return {Promise<void>}
   * @private
   */
  _setPayload() {
    const oThis = this;
    logger.log('Start:: _setPayload for ProfileTransactionSendSuccess');

    oThis.publishUserIds = [oThis.transaction.fromUserId];

    oThis.payload = {
      actorId: oThis.transaction.fromUserId,
      subjectUserId: oThis.transaction.toUserIds[0],
      transactionId: oThis.transaction.id
    };

    logger.log('End:: _setPayload for ProfileTransactionSendSuccess');
  }
}

module.exports = ProfileTransactionSendSuccess;
