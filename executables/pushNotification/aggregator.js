/**
 * Example: node executables/pushNotification/aggregator.js --cronProcessId 7
 *
 * @module executables/pushNotification/aggregator
 */

const program = require('commander');

const rootPrefix = '../..',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  AggregatedNotificationModel = require(rootPrefix + '/app/models/mysql/AggregatedNotification'),
  UserNotificationCountModel = require(rootPrefix + '/app/models/cassandra/UserNotificationCount'),
  NotificationHookModel = require(rootPrefix + '/app/models/mysql/NotificationHook'),
  UserDeviceIdsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceIdsByUserIds'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
  aggregatedNotificationsConstants = require(rootPrefix + '/lib/globalConstant/aggregatedNotifications'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  sigIntConstant = require(rootPrefix + '/lib/globalConstant/sigInt'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/pushNotification/aggregator --cronProcessId 7');
  logger.log('');
  logger.log('');
});

const cronProcessId = +program.cronProcessId;

if (!cronProcessId) {
  program.help();
  process.exit(1);
}

/**
 * Class for push notification aggregator.
 *
 * @class NotificationAggregator
 */
class NotificationAggregator extends CronBase {
  /**
   * Constructor for push notification aggregator.
   *
   * @augments CronBase
   *
   * @constructor
   */
  constructor() {
    const params = { cronProcessId: cronProcessId };

    super(params);

    const oThis = this;

    oThis.page = 1;

    oThis.canExit = true;
  }

  /**
   * Start the executable.
   *
   * @returns {Promise<any>}
   * @private
   */
  async _start() {
    const oThis = this;

    oThis.canExit = false;

    while (sigIntConstant.getSigIntStatus != 1) {
      oThis._initParams();

      await oThis._fetchAggregatedDetails();

      for (let userId in oThis.userIdToAggregatedDetailsMap) {
        oThis.recipientUserIds.push(userId);
      }

      if (oThis.recipientUserIds.length < 1) {
        oThis.canExit = true;
        return responseHelper.successWithData({});
      }

      await oThis._getUsers();
      await oThis._fetchDeviceIdsForRecipients();
      await oThis._insertIntoNotificationHook();
      await oThis._resetDataForSentUsers();

      oThis.page = oThis.page + 1;
    }

    oThis.canExit = true;

    return responseHelper.successWithData({});
  }

  /**
   * Init params for current iteration
   *
   * @private
   */
  _initParams() {
    const oThis = this;

    oThis.currentTimeInSec = parseInt(new Date().getTime() / 1000);

    oThis.whitelistedUserIds = [];
    oThis.notificationSentUserIds = [];

    oThis.userIdToAggregatedDetailsMap = {};
    oThis.recipientUserIds = [];
    oThis.userIdToUserDeviceIdsMap = {};
  }

  /**
   * Fetch pending notification.
   * Fetch rows from aggregated_notifications table.
   *
   * @returns {Promise<void>}
   *
   * @sets oThis.userIdToAggregatedDetailsMap
   * @private
   *
   */
  async _fetchAggregatedDetails() {
    const oThis = this;

    let queryParams = {
      page: oThis.page,
      limit: 50,
      sendTime: oThis.currentTimeInSec
    };

    oThis.userIdToAggregatedDetailsMap = await new AggregatedNotificationModel().fetchPendingBySendTime(queryParams);
  }

  /**
   * Fetch whitelistedUserIds (active creators can receive this notification)
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getUsers() {
    const oThis = this;

    const userByIdResponse = await new UserMultiCache({ ids: oThis.recipientUserIds }).fetch();

    if (userByIdResponse.isFailure()) {
      return Promise.reject(userByIdResponse);
    }

    for (let userId in userByIdResponse.data) {
      let userObj = userByIdResponse.data[userId];
      if (userObj && userObj.status == userConstants.activeStatus && UserModel.isUserApprovedCreator(userObj)) {
        oThis.whitelistedUserIds.push(userId);
      }
    }
  }

  /**
   * Fetch user device ids for user ids
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchDeviceIdsForRecipients() {
    const oThis = this;

    const userDeviceCacheRsp = await new UserDeviceIdsByUserIdsCache({ userIds: oThis.whitelistedUserIds }).fetch();

    if (userDeviceCacheRsp.isFailure()) {
      return Promise.reject(userDeviceCacheRsp);
    }

    oThis.userIdToUserDeviceIdsMap = userDeviceCacheRsp.data;
  }

  /**
   * Insert into notification hook.
   *
   * @returns {Promise<any[]>}
   * @private
   */
  async _insertIntoNotificationHook() {
    const oThis = this;

    let promiseArray = [],
      insertColumnNames = [
        'event_type',
        'user_device_ids',
        'raw_notification_payload',
        'execution_timestamp',
        'status'
      ],
      insertColumnValues = [];

    for (let i = 0; i < oThis.whitelistedUserIds.length; i++) {
      let userId = oThis.whitelistedUserIds[i],
        deviceIds = oThis.userIdToUserDeviceIdsMap[userId],
        aggregatedNotificationsPayload = oThis.userIdToAggregatedDetailsMap[userId];

      if (!deviceIds || deviceIds.length < 1) {
        continue;
      }

      oThis.notificationSentUserIds.push(userId);

      aggregatedNotificationsPayload.extraData.headingVersion = oThis._getHeadingVersion(
        aggregatedNotificationsPayload.extraData
      );

      let insertRow = [
        notificationHookConstants.invertedEventTypes[notificationHookConstants.aggregatedTxReceiveSuccessKind],
        JSON.stringify(deviceIds),
        JSON.stringify(aggregatedNotificationsPayload.extraData),
        Math.round(Date.now() / 1000),
        notificationHookConstants.invertedStatuses[notificationHookConstants.pendingStatus]
      ];

      insertColumnValues.push(insertRow);
    }

    if (insertColumnValues.length > 0) {
      promiseArray.push(new NotificationHookModel().insertMultiple(insertColumnNames, insertColumnValues, {}).fire());
      promiseArray.push(
        new UserNotificationCountModel().incrementUnreadNotificationCount({ userIds: oThis.notificationSentUserIds })
      );
      await Promise.all(promiseArray);
    }
  }

  /**
   * Get heading version.
   *
   * @param notificationData
   * @private
   */
  _getHeadingVersion(notificationData) {
    if (notificationData.actorCount && notificationData.actorCount > 1) {
      if (notificationData.payload && notificationData.payload.amountInEth) {
        if (notificationData.payload.amountInEth > 1) {
          return 1;
        }
        return 4;
      }
    } else if (notificationData.actorCount && notificationData.actorCount === 1) {
      if (notificationData.payload && notificationData.payload.amountInEth) {
        if (notificationData.payload.amountInEth > 1) {
          return 2;
        }
        return 3;
      }
    }

    return 1;
  }

  /**
   * Reset data for sent notifications
   *
   * @returns {Promise<void>}
   * @private
   */
  async _resetDataForSentUsers() {
    const oThis = this;

    if (oThis.notificationSentUserIds.length > 0) {
      await new AggregatedNotificationModel()
        .update({
          extra_data: null,
          status: aggregatedNotificationsConstants.invertedStatuses[aggregatedNotificationsConstants.sentStatus]
        })
        .where({
          user_id: oThis.notificationSentUserIds
        })
        .fire();
    }

    let inactiveUserIds = [];

    for (let i = 0; i < oThis.recipientUserIds.length; i++) {
      let userId = oThis.recipientUserIds[i];
      if (oThis.notificationSentUserIds.indexOf(userId) == -1) {
        inactiveUserIds.push(userId);
      }
    }

    if (inactiveUserIds.length > 0) {
      await new AggregatedNotificationModel()
        .update({
          extra_data: null,
          status: aggregatedNotificationsConstants.invertedStatuses[aggregatedNotificationsConstants.inactiveStatus]
        })
        .where({
          user_id: inactiveUserIds
        })
        .fire();
    }
  }

  /**
   * This function provides info whether the process has to exit.
   *
   * @returns {boolean}
   * @private
   */
  _pendingTasksDone() {
    const oThis = this;

    return oThis.canExit;
  }

  /**
   * Run validations on input parameters.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {}

  /**
   * Get cron kind.
   *
   * @returns {string}
   *
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.pushNotificationAggregator;
  }
}

const cronProcessesMonitor = new NotificationAggregator({ cronProcessId: +cronProcessId });

cronProcessesMonitor
  .perform()
  .then(function() {
    logger.step('** Exiting process');
    logger.info('Cron last run at: ', Date.now());
    process.emit('SIGINT');
  })
  .catch(function(err) {
    logger.error('** Exiting process due to Error: ', err);
    process.emit('SIGINT');
  });
