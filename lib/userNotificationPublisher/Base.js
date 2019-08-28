const rootPrefix = '../..',
  // CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  NotificationHookModel = require(rootPrefix + '/app/models/mysql/NotificationHook'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification');

// Declare error config.
const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

/**
 * Constructor for base class for user notification publish.
 *
 * @class UserNotificationPublisherBase
 */
class UserNotificationPublisherBase {
  /**
   * Constructor for base class for user notification publish.
   *
   * @constructor
   */
  constructor() {
    const oThis = this;

    oThis.publishUserIds = [];
    oThis.payload = {};
  }

  /**
   * Main performer method for the class.
   *
   * @returns {Promise<*>}
   */
  perform() {
    const oThis = this;

    return oThis._asyncPerform().catch(async function(err) {
      logger.error(' In catch block of userNotificationPublisher/Base.js', err);

      const errorObject = responseHelper.error({
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
   * Enqueue notification job.
   *
   * @return {Promise<void>}
   */
  async enqueueUserNotification() {
    const oThis = this;

    // Insert into notification_hokks table for hook push notifications.
    await oThis._insertIntoNotificationHook();

    const promises = [];

    logger.log('Start:: enqueueUserNotification for Base.', oThis.publishUserIds);

    for (let index = 0; index < oThis.publishUserIds.length; index++) {
      oThis.payload.kind = oThis._userNotificationKind();
      const enqueueParams = {
        publishUserId: oThis.publishUserIds[index],
        insertParams: oThis.payload
      };

      promises.push(notificationJobEnqueue.enqueue(oThis._jobTopic(), enqueueParams));
    }
    await Promise.all(promises);

    logger.log('End:: enqueueUserNotification for Base.');
  }

  /**
   * Insert into notification hook.
   *
   * @returns {Promise<any[]>}
   * @private
   */
  async _insertIntoNotificationHook() {
    const oThis = this;

    console.log('oThis.publishUserIds ======', oThis.publishUserIds);

    const promiseArray = [],
      publishUserIds = basicHelper.deepDup(oThis.publishUserIds);

    while (publishUserIds.length > 0) {
      const currentUserIds = publishUserIds.splice(0, notificationHookConstants.hookSenderBatchSize);

      let insertParams = {
        event_type: userNotificationConstants.invertedKinds[oThis._userNotificationKind()],
        recipients: JSON.stringify(currentUserIds),
        raw_notification_payload: JSON.stringify(oThis.payload),
        execution_timestamp: Math.round(Date.now() / 1000),
        status: notificationHookConstants.invertedStatuses[notificationHookConstants.pendingStatus]
      };

      // Create entry in notification hooks of mySql.
      promiseArray.push(new NotificationHookModel().insert(insertParams).fire());
    }

    return Promise.all(promiseArray);
  }

  /**
   * Async performer.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Validate and sanitize parameters.
   *
   * @return {Promise<void>}
   * @private
   */
  _validateAndSanitizeParams() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Topic name for the job.
   *
   * @return {Promise<void>}
   * @private
   */
  _jobTopic() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Set payload for notification.
   *
   * @return {Promise<void>}
   * @private
   */
  _setPayload() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Set user notification kind.
   *
   * @return {Promise<void>}
   * @private
   */
  _userNotificationKind() {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = UserNotificationPublisherBase;
