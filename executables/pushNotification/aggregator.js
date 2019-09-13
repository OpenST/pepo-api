/**
 * Example: node executables/pushNotification/aggregator.js --cronProcessId 7
 *
 * @module executables/pushNotification/aggregator
 */

const program = require('commander');

const rootPrefix = '../..',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  AggregatedNotificationModel = require(rootPrefix + '/app/models/mysql/AggregatedNotification'),
  NotificationHookModel = require(rootPrefix + '/app/models/mysql/NotificationHook'),
  UserDeviceIdsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceIdsByUserIds'),
  LocationsCache = require(rootPrefix + '/lib/cacheManagement/single/Locations'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
  aggregatedNotificationsConstants = require(rootPrefix + '/lib/globalConstant/aggregatedNotifications'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
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

    oThis.currentTimeInSec = parseInt(new Date().getTime() / 1000);

    oThis.userIdToAggregatedDetailsMap = {};
    oThis.recipientUserIds = [];
    oThis.userIdToUserDeviceIdsMap = {};

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

    //todo: use pagination
    //todo: not sent status

    await oThis._fetchAggregatedDetails();

    for (let userId in oThis.userIdToAggregatedDetailsMap) {
      oThis.recipientUserIds.push(userId);
    }

    await oThis._fetchDeviceIdsForRecipients();
    await oThis._insertIntoNotificationHook();
    await oThis._resetDataForSentUsers();

    oThis.canExit = true;

    return responseHelper.successWithData({});
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

    oThis.userIdToAggregatedDetailsMap = await new AggregatedNotificationModel().fetchPendingBySendTime({
      sendTime: oThis.currentTimeInSec
    });
  }

  /**
   * Fetch user device ids for user ids
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchDeviceIdsForRecipients() {
    const oThis = this;

    const userDeviceCacheRsp = await new UserDeviceIdsByUserIdsCache({ userIds: oThis.recipientUserIds }).fetch();

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

    for (let i = 0; i < oThis.recipientUserIds.length; i++) {
      let userId = oThis.recipientUserIds[i],
        deviceIds = oThis.userIdToUserDeviceIdsMap[userId],
        aggregatedNotificationsPayload = oThis.userIdToAggregatedDetailsMap[userId];

      if (!deviceIds || deviceIds.length < 1) {
        continue;
      }

      let rawPayloadForMsgFormatter = aggregatedNotificationsPayload.extraData.payload;

      logger.log('======= aggregatedNotificationsPayload :::', JSON.stringify(aggregatedNotificationsPayload));

      let insertRow = [
        notificationHookConstants.invertedEventTypes[notificationHookConstants.aggregatedTxReceiveSuccessKind],
        JSON.stringify(deviceIds),
        JSON.stringify(rawPayloadForMsgFormatter),
        Math.round(Date.now() / 1000),
        notificationHookConstants.invertedStatuses[notificationHookConstants.pendingStatus]
      ];

      insertColumnValues.push(insertRow);
    }

    promiseArray.push(new NotificationHookModel().insertMultiple(insertColumnNames, insertColumnValues, {}).fire());

    await Promise.all(promiseArray);
  }

  /**
   * Reset data for sent notifications
   *
   * @returns {Promise<void>}
   * @private
   */
  async _resetDataForSentUsers() {
    const oThis = this;

    await new AggregatedNotificationModel()
      .update({
        extra_data: null,
        status: aggregatedNotificationsConstants.invertedStatuses[aggregatedNotificationsConstants.sentStatus]
      })
      .where({
        user_id: oThis.recipientUserIds
      });
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
