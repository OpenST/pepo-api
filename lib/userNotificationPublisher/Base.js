const rootPrefix = '../..',
  LocationByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/Location'),
  NotificationSubscriber = require(rootPrefix + '/lib/jobs/notification/Subscriber'),
  NotificationHookModel = require(rootPrefix + '/app/models/mysql/NotificationHook'),
  UserDeviceByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceByIds'),
  UserBlockedListCache = require(rootPrefix + '/lib/cacheManagement/single/UserBlockedList'),
  AggregatedNotificationModel = require(rootPrefix + '/app/models/mysql/AggregatedNotification'),
  UserNotificationCountModel = require(rootPrefix + '/app/models/cassandra/UserNotificationCount'),
  UserDeviceIdsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceIdsByUserIds'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  userDeviceConstants = require(rootPrefix + '/lib/globalConstant/userDevice'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
  userProfileElementConstants = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  aggregatedNotificationsConstants = require(rootPrefix + '/lib/globalConstant/aggregatedNotifications');

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
    oThis.blockedByUserData = null;
    oThis.deviceIdToUserIdMap = {};
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
   * @returns {Promise<void>}
   */
  async enqueueUserNotification() {
    const oThis = this;

    const isNotificationBlocked = await oThis._notificationIsFromBlockedUser();
    if (isNotificationBlocked) {
      return;
    }

    if (!userNotificationConstants.isNotificationCentreEventKind(oThis._userNotificationKind())) {
      return;
    }

    const promises = [];

    logger.log('Start:: enqueueUserNotification for Base.', oThis.publishUserIds);

    // Skip user ids which have blocked relation with actors or subject user ids.
    for (let index = 0; index < oThis.publishUserIds.length; index++) {
      const insertParam = JSON.parse(JSON.stringify(oThis.payload)),
        publishUserId = oThis.publishUserIds[index];

      if (oThis.blockedByUserData.hasBlocked[publishUserId] || oThis.blockedByUserData.blockedBy[publishUserId]) {
        logger.log('SKIPPED for publishUserId====1===========', publishUserId);
        continue;
      }

      insertParam.kind = oThis._userNotificationKind();

      if (!insertParam.kind) {
        throw new Error('KIND NOT FOUND');
      }

      // Set headingVersion for activity centre.
      insertParam.headingVersion = oThis._getHeadingVersionForActivityCentre(publishUserId);

      const enqueueParams = {
        publishUserId: publishUserId,
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
   * @returns {Promise<void>}
   * @private
   */
  async _insertIntoNotificationHook() {
    const oThis = this;

    console.log('===Santhosh 1 called');

    const isNotificationBlocked = await oThis._notificationIsFromBlockedUser();
    if (isNotificationBlocked) {
      return;
    }

    if (!notificationHookConstants.isPushNotificationEventType(oThis._notificationHookKind())) {
      return;
    }

    const userIds = [];
    // Remove user ids which have blocked relation with actors or subject user ids.
    for (let ind = 0; ind < oThis.publishUserIds.length; ind++) {
      const publishUserId = oThis.publishUserIds[ind];

      if (!oThis.blockedByUserData.hasBlocked[publishUserId] && !oThis.blockedByUserData.blockedBy[publishUserId]) {
        userIds.push(publishUserId);
      }
    }

    await oThis._getUserDeviceIds(userIds);

    logger.log('oThis.userDeviceIds', oThis.userDeviceIds);

    await oThis._createEntriesForUserDeviceIdsInNotificationHookModel();
  }

  /**
   * Create entries in notification hooks model.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createEntriesForUserDeviceIdsInNotificationHookModel() {
    const oThis = this;

    const notificationHookKind = oThis._notificationHookKind();

    const promiseArray = [];

    oThis._getHeadingVersion();

    while (oThis.userDeviceIds.length > 0) {
      const userDeviceIds = oThis.userDeviceIds.splice(0, notificationHookConstants.hookSenderBatchSize);

      // Fetch publish user ids.
      let puIds = [];
      for (let udi = 0; udi < userDeviceIds.length; udi++) {
        const deviceId = userDeviceIds[udi],
          userId = oThis.deviceIdToUserIdMap[deviceId];

        if (userId == 128) {
          continue;
        }
        puIds.push(userId);
      }
      if (puIds.length === 0) {
        continue;
      }
      puIds = [...new Set(puIds)];

      // Create push notification insertion parameters.
      const insertParams = {
        event_type: notificationHookConstants.invertedEventTypes[notificationHookKind],
        user_device_ids: JSON.stringify(userDeviceIds),
        raw_notification_payload: JSON.stringify(oThis.payload),
        execution_timestamp: Math.round(Date.now() / 1000),
        status: notificationHookConstants.invertedStatuses[notificationHookConstants.pendingStatus]
      };

      // Create entry in notification hooks of MySql.
      promiseArray.push(new NotificationHookModel().insert(insertParams).fire());
      const promiseResp = new UserNotificationCountModel().incrementUnreadNotificationCount({
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

    await oThis._setBlockedUserList();

    for (let index = 0; index < oThis.payload.actorIds.length; index++) {
      const uId = oThis.payload.actorIds[index];
      if (oThis.blockedByUserData.hasBlocked[uId] || oThis.blockedByUserData.blockedBy[uId]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Set blocked user list.
   *
   * @sets oThis.blockedByUserData
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setBlockedUserList() {
    const oThis = this;

    if (!oThis.blockedByUserData) {
      const cacheResp = await new UserBlockedListCache({ userId: oThis.payload.subjectUserId }).fetch();
      if (cacheResp.isSuccess()) {
        oThis.blockedByUserData = cacheResp.data[oThis.payload.subjectUserId];
      }

      for (let index = 0; index < oThis.payload.actorIds.length; index++) {
        const actorId = oThis.payload.actorIds[index];
        const cacheResponse = await new UserBlockedListCache({ userId: actorId }).fetch();
        if (cacheResponse.isSuccess()) {
          const actorBlockedByUserList = cacheResponse.data[actorId];
          Object.assign(oThis.blockedByUserData.hasBlocked, actorBlockedByUserList.hasBlocked);
          Object.assign(oThis.blockedByUserData.blockedBy, actorBlockedByUserList.blockedBy);
        }
      }
    }
  }

  /**
   * Get notification send time.
   *
   * @param {number} locationId
   * @param {number} lastSendTimeInSec
   *
   * @returns {Promise<*>}
   */
  async getSendTime(locationId, lastSendTimeInSec) {
    const daySeconds = 24 * 60 * 60;

    let userTimezoneOffsetInSecond = 0;

    if (locationId) {
      const cacheRsp = await new LocationByIdsCache({ ids: [locationId] }).fetch();

      if (cacheRsp.isFailure()) {
        return Promise.reject(cacheRsp);
      }
      const locationObj = cacheRsp.data[locationId];

      userTimezoneOffsetInSecond = locationObj.gmtOffset;
    }

    const currentEpochTimeInMilliSecond = new Date().getTime(),
      currentEpochTimeInSecond = currentEpochTimeInMilliSecond / 1000,
      currentEpochDayTimeInSecond = parseInt(currentEpochTimeInSecond / daySeconds) * daySeconds;

    let sendTime =
      currentEpochDayTimeInSecond -
      userTimezoneOffsetInSecond +
      aggregatedNotificationsConstants.defaultTimeToSendInSeconds;

    if (sendTime <= currentEpochTimeInSecond) {
      sendTime += daySeconds;
    }

    // Min 6 hours difference before next notification, in case of time zone change.
    if (lastSendTimeInSec + 6 * 60 * 60 > sendTime) {
      sendTime += daySeconds;
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

    let locationId = null;

    const userId = oThis.transaction.extraData.toUserIds[0];

    const cacheRsp = await new UserProfileElementsByUserIdCache({ usersIds: [userId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    const profileElementsData = cacheRsp.data,
      userProfileElements = profileElementsData[userId];
    if (
      userProfileElements &&
      userProfileElements[userProfileElementConstants.locationIdKind] &&
      userProfileElements[userProfileElementConstants.locationIdKind].data
    ) {
      locationId = userProfileElements[userProfileElementConstants.locationIdKind].data;
    }

    const amountInEth = basicHelper.convertWeiToNormal(oThis.transaction.extraData.amounts[0]);

    const aggregationPayload = {
      actorIds: [oThis.transaction.fromUserId],
      actorCount: 1,
      subjectUserId: oThis.transaction.extraData.toUserIds[0],
      payload: {
        amountInEth: amountInEth
      }
    };

    const existingRows = await new AggregatedNotificationModel()
      .select('*')
      .where({ user_id: userId })
      .fire();

    let existingRow = null;

    if (existingRows.length > 0) {
      existingRow = new AggregatedNotificationModel().formatDbData(existingRows[0]);
    }

    // Note: Kind has not been added. It must be added by the aggregator cron
    if (!existingRow) {
      const sendTime = await oThis.getSendTime(locationId, 0);

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

      if (existingRow.status === aggregatedNotificationsConstants.sentStatus) {
        const sendTime = await oThis.getSendTime(locationId, existingRow.sendTime);

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
      } else if (existingRow.status === aggregatedNotificationsConstants.inactiveStatus) {
        const sendTime = await oThis.getSendTime(locationId, 0);

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
      } else if (existingRow.status === aggregatedNotificationsConstants.pendingStatus) {
        const existingExtraData = existingRow.extraData,
          existingActorIds = existingExtraData.actorIds,
          existingActorCount = existingExtraData.actorCount;

        if (
          existingActorCount <= aggregatedNotificationsConstants.maxActorCount &&
          existingActorIds.indexOf(aggregationPayload.actorIds[0]) === -1
        ) {
          existingExtraData.actorCount += 1;
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
   * @param {array<number>} userIds
   *
   * @sets oThis.deviceIdToUserIdMap, oThis.userDeviceIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getUserDeviceIds(userIds) {
    const oThis = this;

    const deviceIdsResponse = await new UserDeviceIdsByUserIdsCache({ userIds: userIds }).fetch();
    if (deviceIdsResponse.isFailure()) {
      return Promise.reject(deviceIdsResponse);
    }

    oThis.deviceIdToUserIdMap = {};
    oThis.userDeviceIds = [];

    const userDeviceIds = [];

    const deviceIdsRspData = deviceIdsResponse.data;

    for (const userId in deviceIdsRspData) {
      if (Array.isArray(deviceIdsRspData[userId])) {
        for (let ind = 0; ind < deviceIdsRspData[userId].length; ind++) {
          const deviceId = deviceIdsRspData[userId][ind];
          userDeviceIds.push(deviceId);
          oThis.deviceIdToUserIdMap[deviceId] = userId;
        }
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

    for (const id in userDevicesResponseData) {
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

    console.log('===Santhosh 2 called');

    logger.log('From base.');
    oThis.payload.headingVersion = 1;
  }

  /**
   * Get DEFAULT heading version for activity centre.
   *
   * @returns {number}
   * @private
   */
  _getHeadingVersionForActivityCentre() {
    return 1;
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
   * @returns {Promise<void>}
   * @private
   */
  _validateAndSanitizeParams() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Set payload for notification.
   *
   * @returns {Promise<void>}
   * @private
   */
  _setNotificationCentrePayload() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Set user notification kind.
   *
   * @returns {string}
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
