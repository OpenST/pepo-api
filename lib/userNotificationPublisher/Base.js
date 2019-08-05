/**
 * User Notification Publishing base
 *
 * @module lib/userNotificationPublisher/Base
 */

const rootPrefix = '../..',
  // CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

// Declare error config.
const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

/**
 * Constructor for base class for User Notification Publish.
 *
 * @class
 */
class UserNotificationPublisherBase {
  /**
   * Constructor
   *
   * @param {Object} params
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.publishUserIds = [];
    oThis.payload = {};
  }

  /**
   * Main performer method for the class.
   *
   * @returns {Promise<T>}
   */
  perform() {
    const oThis = this;

    return oThis._asyncPerform().catch(async function(err) {
      logger.error(' In catch block of userNotificationPublisher/Base.js', err);

      let errorObject = responseHelper.error({
        internal_error_identifier: 'l_unp_b_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { error: err.toString() },
        error_config: errorConfig
      });

      createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return errorObject;
    });
  }

  /**
   * Enqueue Notificaton Job
   *
   * @return {Promise<void>}
   * @private
   */
  async _enqueueUserNotification() {
    const oThis = this;

    const promises = [];

    logger.log('Start:: _enqueueUserNotification for Base');

    for (let i = 0; i < oThis.publishUserIds.length; i++) {
      oThis.payload['publishUserId'] = oThis.publishUserIds[i];
      promises.push(BgJob.enqueue(oThis._jobTopic(), oThis.payload));
    }
    await Promise.all(promises);

    logger.log('End:: _enqueueUserNotification for Base');
  }

  /**
   * Validate and Sanitize parameters.
   *
   * @return {Promise<void>}
   * @private
   */
  _validateAndSanitizeParams() {
    throw `Unimplemented method _validateAndSanitizeParams for TransactionOstEvent`;
  }

  /**
   * Topic name for the job
   *
   * @return {Promise<void>}
   * @private
   */
  _jobTopic() {
    throw `Unimplemented method _jobTopic for TransactionOstEvent`;
  }

  /**
   * Set Payload for notification
   *
   * @return {Promise<void>}
   * @private
   */
  _setPayload() {
    throw `Unimplemented method _setPayload for TransactionOstEvent`;
  }
}

module.exports = UserNotificationPublisherBase;
