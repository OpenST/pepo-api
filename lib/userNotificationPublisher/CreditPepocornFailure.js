const BigNumber = require('bignumber.js');

const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Constructor for redemption transaction failure publishing.
 *
 * @class CreditPepocornFailure
 */
class CreditPepocornFailure extends UserNotificationPublisherBase {
  /**
   * Constructor for video user transaction send failure publishing.
   *
   * @param {object} params
   * @param {object} params.transaction
   * @param {string} params.transaction.status
   * @param {string/number} params.transaction.id
   * @param {string/number} params.transaction.fromUserId
   * @param {object} params.transaction.extraData
   * @param {array<string/number>} params.transaction.toUserId
   * @param {number} params.pepocornAmount
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.transaction = params.transaction;
    oThis.pepocornAmount = params.pepocornAmount;
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._setNotificationCentrePayload();

    await oThis.enqueueUserNotification();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize parameters.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    let hasError = false;
    const tx = oThis.transaction;

    logger.log('Start:: Validate for CreditPepocornFailure');

    if (!CommonValidators.validateNonNegativeNumber(oThis.pepocornAmount)) {
      hasError = true;
    }

    if (!CommonValidators.validateNonEmptyObject(tx)) {
      hasError = true;
    }

    if (!hasError && tx.status !== transactionConstants.failedStatus) {
      hasError = true;
    }

    if (!hasError && (!tx.id || !tx.fromUserId)) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_cpf_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { transaction: oThis.transaction, pepocornAmount: oThis.pepocornAmount }
        })
      );
    }

    logger.log('End:: Validate for CreditPepocornFailure');
  }

  /**
   * Set payload for notification.
   *
   * @sets oThis.publishUserIds, oThis.payload
   *
   * @return {Promise<void>}
   * @private
   */
  _setNotificationCentrePayload() {
    const oThis = this;
    logger.log('Start:: _setNotificationCentrePayload for CreditPepocornFailure');

    oThis.publishUserIds = [oThis.transaction.fromUserId];

    oThis.payload = {
      actorIds: [oThis.transaction.fromUserId],
      actorCount: 1,
      subjectUserId: oThis.transaction.fromUserId,
      payload: {
        transactionId: oThis.transaction.id,
        pepocornAmount: oThis.pepocornAmount
      }
    };

    logger.log('End:: _setNotificationCentrePayload for CreditPepocornFailure');
  }

  /**
   * Get heading version.
   *
   * @returns {number}
   * @private
   */
  _getHeadingVersionForActivityCentre() {
    const oThis = this;
    logger.log('oThis.pepocornAmount ======', oThis.pepocornAmount);

    const pepocornAmountInBn = new BigNumber(oThis.pepocornAmount),
      onePepocornInBn = new BigNumber('1');

    logger.log('From credit pepocornAmount failure.');

    if (pepocornAmountInBn.gt(onePepocornInBn)) {
      return 1;
    } else {
      return 2;
    }
  }

  /**
   * Set user notification kind.
   *
   * @returns {string}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.creditPepocornFailureKind;
  }
}

module.exports = CreditPepocornFailure;
