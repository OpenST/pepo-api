const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/big/notificationHook'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Constructor for profile user transaction receive success publishing.
 *
 * @class ProfileTransactionReceiveSuccess
 */
class ProfileTransactionReceiveSuccess extends UserNotificationPublisherBase {
  /**
   * Constructor for profile user transaction receive success publishing.
   *
   * @param {object} params
   * @param {object} params.transaction
   * @param {string} params.transaction.status
   * @param {string/number} params.transaction.id
   * @param {string/number} params.transaction.fromUserId
   * @param {object} params.transaction.extraData
   * @param {array<string/number>} params.transaction.toUserId
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

    await oThis.enqueueUserNotification();

    await oThis._insertIntoAggregatedNotificationsTable();

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

    logger.log('Start:: Validate for ProfileTransactionReceiveSuccess');

    if (!CommonValidators.validateNonEmptyObject(tx)) {
      hasError = true;
    }

    if (!hasError && tx.status !== transactionConstants.doneStatus) {
      hasError = true;
    }

    if (!hasError && (!tx.id || !tx.fromUserId || !tx.toUserId)) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_ptrs_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { transaction: oThis.transaction }
        })
      );
    }

    logger.log('End:: Validate for ProfileTransactionReceiveSuccess');
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

    logger.log('Start:: _setNotificationCentrePayload for ProfileTransactionReceiveSuccess');

    oThis.publishUserIds = [oThis.transaction.toUserId];

    oThis.payload = {
      actorIds: [oThis.transaction.fromUserId],
      actorCount: 1,
      subjectUserId: oThis.transaction.toUserId,
      payload: {
        transactionId: oThis.transaction.id,
        amount: oThis.transaction.amount
      },
      thankYouFlag: 0
    };

    logger.log('End:: _setNotificationCentrePayload for ProfileTransactionReceiveSuccess');
  }

  /**
   * Set user notification kind.
   *
   * @returns {string}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.profileTxReceiveSuccessKind;
  }

  /**
   * Set hook kind.
   *
   * @returns {string}
   * @private
   */
  _notificationHookKind() {
    return notificationHookConstants.aggregatedTxReceiveSuccessKind;
  }
}

module.exports = ProfileTransactionReceiveSuccess;
