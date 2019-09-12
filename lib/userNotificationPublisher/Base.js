const rootPrefix = '../..',
  NotificationSubscriber = require(rootPrefix + '/lib/jobs/notification/Subscriber'),
  NotificationHookModel = require(rootPrefix + '/app/models/mysql/NotificationHook'),
  UserDeviceByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceByIds'),
  UserDeviceIdsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceIdsByUserIds'),
  AggregatedNotificationModel = require(rootPrefix + '/app/models/mysql/AggregatedNotification'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  aggregatedNotificationsConstants = require(rootPrefix + '/lib/globalConstant/aggregatedNotifications'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  userDeviceConstants = require(rootPrefix + '/lib/globalConstant/userDevice'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

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
    oThis.userDeviceIds = [];
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
        debug_options: { error: JSON.stringify(err) },
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

    if (!userNotificationConstants.isNotificationCentreEventKind(oThis._userNotificationKind())) {
      return;
    }

    const promises = [];

    logger.log('Start:: enqueueUserNotification for Base.', oThis.publishUserIds);

    for (let index = 0; index < oThis.publishUserIds.length; index++) {
      oThis.payload.kind = oThis._userNotificationKind();

      const enqueueParams = {
        publishUserId: oThis.publishUserIds[index],
        insertParams: oThis.payload
      };

      promises.push(new NotificationSubscriber(enqueueParams).perform());
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
    const oThis = this,
      promiseArray = [];

    if (!notificationHookConstants.isPushNotificationEventType(oThis._notificationHookKind())) {
      return;
    }

    await oThis._getUserDeviceIds();

    logger.log('oThis.userDeviceIds', oThis.userDeviceIds);

    if (!oThis.payload.kind) {
      oThis.payload.kind = oThis._notificationHookKind();
    }

    while (oThis.userDeviceIds.length > 0) {
      const userDeviceIds = oThis.userDeviceIds.splice(0, notificationHookConstants.hookSenderBatchSize);

      let insertParams = {
        event_type: notificationHookConstants.invertedEventTypes[oThis._notificationHookKind()],
        user_device_ids: JSON.stringify(userDeviceIds),
        raw_notification_payload: JSON.stringify(oThis.payload),
        execution_timestamp: Math.round(Date.now() / 1000),
        status: notificationHookConstants.invertedStatuses[notificationHookConstants.pendingStatus]
      };

      // Create entry in notification hooks of mySql.
      promiseArray.push(new NotificationHookModel().insert(insertParams).fire());
    }

    let psRsp = Promise.all(promiseArray);
  }

  /**
   * Insert into aggregated notifications table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertIntoAggregatedNotificationsTable() {
    const oThis = this;

    let locationId = null,
      userId = oThis.publishUserIds[0];

    const cacheRsp = await new UserProfileElementsByUserIdCache({ usersIds: [userId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }
    const profileElementsData = cacheRsp.data,
      userProfileElements = profileElementsData[userId];
    if (userProfileElements[userProfileElementConst.locationIdKind].data) {
      locationId = userProfileElements[userProfileElementConst.locationIdKind].data;
    }

    let existingRow = await new AggregatedNotificationModel()
      .select('*')
      .where({ user_id: userId })
      .fire();

    if (existingRow.length === 0) {
      oThis.payload.payload.senders = oThis.payload.actorIds;

      const insertParams = {
        user_id: userId,
        location_id: locationId,
        extra_data: JSON.stringify(oThis.payload),
        status: aggregatedNotificationsConstants.invertedStatuses[aggregatedNotificationsConstants.pendingStatus]
      };

      console.log('insertParams------', JSON.stringify(insertParams));

      await new AggregatedNotificationModel().insert(insertParams).fire();
    } else {
      let newExtraDataToBeInserted = {};

      console.log('existingRow[0]------', JSON.stringify(existingRow[0]));

      let existingExtraData = JSON.parse(existingRow[0].extra_data),
        newPayload = oThis.payload,
        existingAmount = existingExtraData.payload.amount,
        existingSenders = existingExtraData.payload.senders,
        newAmountToAdd = newPayload.payload.amount,
        newSenderToAdd = newPayload.actorIds;

      console.log('========AMOUNT======existingAmount==newAmountToAdd======', existingAmount, newAmountToAdd);
      console.log('========Senders======existingSenders==newSenderToAdd======', existingSenders, newSenderToAdd);

      let allSenders = existingSenders.concat(newSenderToAdd),
        uniqUserIds = [...new Set(allSenders)],
        finalTxAmount = Number(newAmountToAdd) + Number(existingAmount);

      console.log('allSenders------uniqUserIds-------finalTxAmount---------', allSenders, uniqUserIds, finalTxAmount);

      newExtraDataToBeInserted.senders = uniqUserIds;
      newExtraDataToBeInserted.amount = finalTxAmount;

      newExtraDataToBeInserted = Object.assign(oThis.payload, newExtraDataToBeInserted);

      console.log('newExtraDataToBeInserted---------', JSON.stringify(newExtraDataToBeInserted));

      await new AggregatedNotificationModel()
        .update({
          location_id: locationId,
          extra_data: JSON.stringify(oThis.payload),
          status: aggregatedNotificationsConstants.invertedStatuses[aggregatedNotificationsConstants.pendingStatus]
        })
        .where({
          user_id: userId
        })
        .fire();
    }
  }

  /**
   * Get device ids by user ids for active devices.
   *
   * @sets oThis.userDeviceIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getUserDeviceIds() {
    const oThis = this,
      deviceIdsResponse = await new UserDeviceIdsByUserIdsCache({ userIds: oThis.publishUserIds }).fetch();

    let userDeviceIds = [];

    if (deviceIdsResponse.isFailure()) {
      return Promise.reject(deviceIdsResponse);
    }

    const deviceIdsRspData = deviceIdsResponse.data;

    for (let userId in deviceIdsRspData) {
      if (Array.isArray(deviceIdsRspData[userId])) {
        userDeviceIds = userDeviceIds.concat(deviceIdsRspData[userId]);
      }
    }

    logger.log('userDeviceIds', userDeviceIds);

    if (userDeviceIds.length === 0) {
      return;
    }

    const userDevicesResponse = await new UserDeviceByIdsCache({ ids: userDeviceIds }).fetch();

    logger.log('userDevicesResponse', userDevicesResponse);

    if (userDevicesResponse.isFailure()) {
      return Promise.reject(userDevicesResponse);
    }

    const userDevicesResponseData = userDevicesResponse.data;

    for (let id in userDevicesResponseData) {
      const userDeviceRow = userDevicesResponseData[id];
      if (userDeviceRow.status === userDeviceConstants.activeStatus) {
        oThis.userDeviceIds.push(id);
      }
    }
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
  _setNotificationCentrePayload() {
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

  /**
   * Set hook kind.
   *
   * @returns {string}
   * @private
   */
  _notificationHookKind() {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = UserNotificationPublisherBase;
