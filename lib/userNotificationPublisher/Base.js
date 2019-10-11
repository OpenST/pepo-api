const rootPrefix = '../..',
  NotificationSubscriber = require(rootPrefix + '/lib/jobs/notification/Subscriber'),
  NotificationHookModel = require(rootPrefix + '/app/models/mysql/NotificationHook'),
  UserNotificationCountModel = require(rootPrefix + '/app/models/cassandra/UserNotificationCount'),
  UserDeviceByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceByIds'),
  LocationByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/Location'),
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
  UserBlockedListCache = require(rootPrefix + '/lib/cacheManagement/single/UserBlockedList'),
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

      let errorObject = null;

      if (!responseHelper.isCustomResult(err)) {
        errorObject = responseHelper.error({
          internal_error_identifier: 'l_unp_b_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { error: JSON.stringify(err), stack: err.stack },
          error_config: errorConfig
        });
      }

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

    let isNotificationBlocked = await oThis._notificationIsFromBlockedUser();
    if (isNotificationBlocked) {
      return;
    }

    if (!userNotificationConstants.isNotificationCentreEventKind(oThis._userNotificationKind())) {
      return;
    }

    const promises = [];

    logger.log('Start:: enqueueUserNotification for Base.', oThis.publishUserIds);

    for (let index = 0; index < oThis.publishUserIds.length; index++) {
      let insertParam = JSON.parse(JSON.stringify(oThis.payload));

      insertParam.kind = oThis._userNotificationKind();

      if (!insertParam.kind) {
        throw new Error('KIND NOT FOUND');
      }

      const enqueueParams = {
        publishUserId: oThis.publishUserIds[index],
        insertParams: insertParam
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

    let isNotificationBlocked = await oThis._notificationIsFromBlockedUser();
    if (isNotificationBlocked) {
      return;
    }

    if (!notificationHookConstants.isPushNotificationEventType(oThis._notificationHookKind())) {
      return;
    }

    await oThis._getUserDeviceIds();

    logger.log('oThis.userDeviceIds', oThis.userDeviceIds);

    let notificationHookKind = oThis._notificationHookKind();

    oThis._getHeadingVersion();

    while (oThis.userDeviceIds.length > 0) {
      const userDeviceIds = oThis.userDeviceIds.splice(0, notificationHookConstants.hookSenderBatchSize);

      let insertParams = {
        event_type: notificationHookConstants.invertedEventTypes[notificationHookKind],
        user_device_ids: JSON.stringify(userDeviceIds),
        raw_notification_payload: JSON.stringify(oThis.payload),
        execution_timestamp: Math.round(Date.now() / 1000),
        status: notificationHookConstants.invertedStatuses[notificationHookConstants.pendingStatus]
      };

      let puIds = [];
      for (let i = 0; i < oThis.publishUserIds.length; i++) {
        let userId = oThis.publishUserIds[i];
        // TEMP code fix for 128 cassandra driver issue
        if (userId == 128) {
          continue;
        }
        puIds.push(userId);
      }
      if (puIds.length == 0) {
        continue;
      }

      // Create entry in notification hooks of mySql.
      promiseArray.push(new NotificationHookModel().insert(insertParams).fire());
      let promiseResp = new UserNotificationCountModel().incrementUnreadNotificationCount({
        userIds: puIds
      });

      promiseArray.push(promiseResp);
    }

    await Promise.all(promiseArray);
  }

  /**
   * Check whether notification actor is in blocked list of subject user
   *
   * @returns {Promise<boolean>}
   * @private
   */
  async _notificationIsFromBlockedUser() {
    const oThis = this;

    let cacheResp = await new UserBlockedListCache({ userId: oThis.payload.subjectUserId }).fetch();
    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }
    let blockedByUserInfo = cacheResp.data[oThis.payload.subjectUserId];
    for (let index = 0; index < oThis.payload.actorIds.length; index++) {
      let uId = oThis.payload.actorIds[index];
      if (blockedByUserInfo.hasBlocked[uId] || blockedByUserInfo.blockedBy[uId]) {
        return true;
      }
    }

    return false;
  }

  async getSendTime(locationId, lastSendTimeInSec) {
    const oThis = this,
      daySeconds = 24 * 60 * 60;

    let userTimezoneOffsetInSecond = 0;

    if (locationId) {
      const cacheRsp = await new LocationByIdsCache({ ids: [locationId] }).fetch();

      if (cacheRsp.isFailure()) {
        return Promise.reject(cacheRsp);
      }
      let locationObj = cacheRsp.data[locationId];

      userTimezoneOffsetInSecond = locationObj.gmtOffset;
    }

    let currentEpochTimeInmilisecond = new Date().getTime(),
      currentEpochTimeInSecond = currentEpochTimeInmilisecond / 1000,
      currentEpochDayTimeInSecond = parseInt(currentEpochTimeInSecond / daySeconds) * daySeconds;

    let sendTime =
      currentEpochDayTimeInSecond -
      userTimezoneOffsetInSecond +
      aggregatedNotificationsConstants.defaultTimeToSendInSeconds;

    if (sendTime <= currentEpochTimeInSecond) {
      sendTime = sendTime + daySeconds;
    }

    //min 6 hours difference before next notification, in case of time zone change
    if (lastSendTimeInSec + 6 * 60 * 60 > sendTime) {
      sendTime = sendTime + daySeconds;
    }

    return sendTime;
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
      userId = oThis.transaction.extraData.toUserIds[0];

    const cacheRsp = await new UserProfileElementsByUserIdCache({ usersIds: [userId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    const profileElementsData = cacheRsp.data,
      userProfileElements = profileElementsData[userId];
    if (
      userProfileElements &&
      userProfileElements[userProfileElementConst.locationIdKind] &&
      userProfileElements[userProfileElementConst.locationIdKind].data
    ) {
      locationId = userProfileElements[userProfileElementConst.locationIdKind].data;
    }

    let amountInEth = basicHelper.convertWeiToNormal(oThis.transaction.extraData.amounts[0]);

    let aggregationPayload = {
      actorIds: [oThis.transaction.fromUserId],
      actorCount: 1,
      subjectUserId: oThis.transaction.extraData.toUserIds[0],
      payload: {
        amountInEth: amountInEth
      }
    };

    let existingRows = await new AggregatedNotificationModel()
      .select('*')
      .where({ user_id: userId })
      .fire();

    let existingRow = null;

    if (existingRows.length > 0) {
      existingRow = new AggregatedNotificationModel().formatDbData(existingRows[0]);
    }

    //Note: Kind has not been added. It must be added by the aggregator cron

    if (!existingRow) {
      let sendTime = await oThis.getSendTime(locationId, 0);

      const insertParams = {
        user_id: userId,
        send_time: sendTime,
        extra_data: JSON.stringify(aggregationPayload),
        status: aggregatedNotificationsConstants.invertedStatuses[aggregatedNotificationsConstants.pendingStatus]
      };

      logger.log('Parameters to insert into aggregated notifications table ::: ', JSON.stringify(insertParams));

      await new AggregatedNotificationModel().insert(insertParams).fire();
    } else {
      logger.log('Existing row is::: ', JSON.stringify(existingRow));

      if (existingRow.status == aggregatedNotificationsConstants.sentStatus) {
        let sendTime = await oThis.getSendTime(locationId, existingRow.sendTime);

        await new AggregatedNotificationModel()
          .update({
            send_time: sendTime,
            extra_data: JSON.stringify(aggregationPayload),
            status: aggregatedNotificationsConstants.invertedStatuses[aggregatedNotificationsConstants.pendingStatus]
          })
          .where({
            id: existingRow.id,
            status: aggregatedNotificationsConstants.invertedStatuses[aggregatedNotificationsConstants.sentStatus]
          })
          .fire();
      } else if (existingRow.status == aggregatedNotificationsConstants.inactiveStatus) {
        let sendTime = await oThis.getSendTime(locationId, 0);

        await new AggregatedNotificationModel()
          .update({
            send_time: sendTime,
            extra_data: JSON.stringify(aggregationPayload),
            status: aggregatedNotificationsConstants.invertedStatuses[aggregatedNotificationsConstants.pendingStatus]
          })
          .where({
            id: existingRow.id,
            status: aggregatedNotificationsConstants.invertedStatuses[aggregatedNotificationsConstants.inactiveStatus]
          })
          .fire();
      } else if (existingRow.status == aggregatedNotificationsConstants.pendingStatus) {
        let existingExtraData = existingRow.extraData,
          existingActorIds = existingExtraData.actorIds,
          existingActorCount = existingExtraData.actorCount;

        if (
          existingActorCount <= aggregatedNotificationsConstants.maxActorCount &&
          existingActorIds.indexOf(aggregationPayload.actorIds[0]) == -1
        ) {
          existingExtraData.actorCount = existingExtraData.actorCount + 1;
          existingExtraData.actorIds.push(aggregationPayload.actorIds[0]);
        }

        existingExtraData.payload.amountInEth =
          Number(existingExtraData.payload.amountInEth) + Number(aggregationPayload.payload.amountInEth);

        await new AggregatedNotificationModel()
          .update({
            extra_data: JSON.stringify(existingExtraData)
          })
          .where({
            id: existingRow.id,
            status: aggregatedNotificationsConstants.invertedStatuses[aggregatedNotificationsConstants.pendingStatus]
          })
          .fire();
      } else {
        throw new Error(`INVALID STATUS FOR AggregatedNotificationModel:-${existingRow.status}`);
      }
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

    logger.log('User devices response :::', userDevicesResponse);

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
   * Get heading version.
   *
   * @returns {number}
   * @private
   */
  _getHeadingVersion() {
    const oThis = this;

    logger.log('From base.');
    oThis.payload.headingVersion = 1;
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
