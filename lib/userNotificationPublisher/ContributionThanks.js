/**
 * Contribution Thanks
 *
 * @module lib/userNotificationPublisher/ContributionThanks
 */

const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions');

// Declare error config.
const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

/**
 * Constructor for Contribution Thanks Publishing
 *
 * @class
 */
class ContributionThanks extends UserNotificationPublisherBase {
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

    oThis.userNotification = params.userNotification;
    oThis.text = params.text;
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

    logger.log('Start:: Validate for ContributionThanks');

    if (!CommonValidators.validateNonEmptyObject(oThis.userNotification)) {
      hasError = true;
    }

    if (
      !hasError &&
      (!oThis.userNotification.kind ||
        [
          userNotificationConstants.profileTxReceiveSuccessKind,
          userNotificationConstants.videoTxReceiveSuccessKind
        ].indexOf(oThis.userNotification.kind) == -1)
    ) {
      hasError = true;
    }

    if (
      !hasError &&
      (!oThis.userNotification.transactionId ||
        !oThis.userNotification.subjectUserId ||
        !oThis.userNotification.actorIds ||
        oThis.userNotification.actorIds.length != 1)
    ) {
      hasError = true;
    }

    if (!hasError && !CommonValidators.validateNonEmptyObject(oThis.text)) {
      hasError = true;
    }

    //validate text

    if (hasError) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_unp_ct_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { userNotification: oThis.userNotification, text: oThis.text }
        })
      );
    }

    oThis.transactionId = oThis.userNotification.transactionId;
    oThis.senderUserId = oThis.userNotification.subjectUserId;
    oThis.receiverUserId = oThis.userNotification.actorIds[0];

    logger.log('End:: Validate for ContributionThanks');
  }

  /**
   * Topic name for the job
   *
   * @return {Promise<void>}
   * @private
   */
  _jobTopic() {
    return notificationJobConstants.contributionThanks;
  }

  /**
   * Set Payload for notification
   *
   * @return {Promise<void>}
   * @private
   */
  _setPayload() {
    const oThis = this;
    logger.log('Start:: _setPayload for ContributionThanks');

    oThis.publishUserIds = [oThis.receiverUserId];

    oThis.payload = {
      actorId: oThis.senderUserId,
      subjectUserId: oThis.receiverUserId,
      transactionId: oThis.transaction.id
    };

    logger.log('End:: _setPayload for ContributionThanks');
  }
}

module.exports = ContributionThanks;
