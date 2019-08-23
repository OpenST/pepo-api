const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook');

const dbName = databaseConstants.bigDbName;

/**
 * Class for notification hook model.
 *
 * @class NotificationHook
 */
class NotificationHook extends ModelBase {
  /**
   * Constructor for notification hook model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'notification_hooks';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      recipients: JSON.parse(dbRow.recipients),
      pushNotificationPayload: JSON.parse(dbRow.push_notification_payload),
      executionTimestamp: dbRow.execution_timestamp,
      lockIdentifier: dbRow.lock_identifier,
      lockedAt: dbRow.locked_at,
      status: notificationHookConstants.statuses[dbRow.status],
      failedCount: dbRow.failed_count,
      iosResponse: JSON.parse(dbRow.ios_response),
      androidResponse: JSON.parse(dbRow.android_response),
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Function to acquire lock on fresh hooks.
   *
   * @param {string} lockIdentifier
   *
   * @returns {Promise<any>}
   */
  async acquireLocksOnFreshHooks(lockIdentifier) {
    const oThis = this;

    return oThis
      .update({
        lock_identifier: lockIdentifier,
        locked_at: Math.round(Date.now() / 1000)
      })
      .where('lock_identifier IS NULL')
      .where(['execution_timestamp < ?', Math.round(Date.now() / 1000)])
      .where(['status = ?', notificationHookConstants.invertedStatuses[notificationHookConstants.pendingStatus]])
      .limit(notificationHookConstants.batchSizeForHooksProcessor)
      .fire();
  }

  /**
   * Function to acquire lock on failed hooks.
   *
   * @param {string} lockIdentifier
   *
   * @returns {Promise<any>}
   */
  async acquireLocksOnFailedHooks(lockIdentifier) {
    const oThis = this;

    return oThis
      .update({
        lock_identifier: lockIdentifier,
        locked_at: Math.round(Date.now() / 1000)
      })
      .where('lock_identifier IS NULL')
      .where(['failed_count <= ?', notificationHookConstants.retryLimitForFailedHooks])
      .where(['status = ?', notificationHookConstants.invertedStatuses[notificationHookConstants.failedStatus]])
      .limit(notificationHookConstants.batchSizeForHooksProcessor)
      .fire();
  }

  /**
   * Function to fetch locked hooks.
   *
   * @param {string} lockIdentifier
   *
   * @returns {Promise<void>}
   */
  async fetchLockedHooks(lockIdentifier) {
    const oThis = this;

    const response = {};

    const dbRows = await oThis
      .select('*')
      .where(['lock_identifier = ?', lockIdentifier])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Mark status as processed.
   *
   * @param {number} hookId
   * @param {object} successResponse
   *
   * @returns {Promise<void>}
   */
  async markStatusAsProcessed(hookId, successResponse) {
    const oThis = this;

    await oThis
      .update({
        lock_identifier: null,
        locked_at: null,
        success_response: JSON.stringify(successResponse),
        status: notificationHookConstants.invertedStatuses[notificationHookConstants.processedStatus]
      })
      .where(['id = ?', hookId])
      .fire();
  }

  /**
   * Mark hook as failed.
   *
   * @param {number} hookId
   * @param {number} failedCount
   * @param {object} failedLogs
   *
   * @returns {Promise<void>}
   */
  async markFailedToBeRetried(hookId, failedCount, failedLogs) {
    const oThis = this;

    await oThis
      .update({
        status: notificationHookConstants.invertedStatuses[notificationHookConstants.failedStatus],
        failed_count: failedCount + 1,
        lock_identifier: null,
        locked_at: null,
        failed_response: JSON.stringify(failedLogs)
      })
      .where(['id = ?', hookId])
      .fire();
  }

  /**
   * Mark hooks as ignored.
   *
   * @param {number} hookId
   * @param {number} failedCount
   * @param {object} failedLogs
   *
   * @returns {Promise<void>}
   */
  async markFailedToBeIgnored(hookId, failedCount, failedLogs) {
    const oThis = this;

    await oThis
      .update({
        status: notificationHookConstants.invertedStatuses[notificationHookConstants.ignoredStatus],
        failed_count: failedCount + 1,
        lock_identifier: null,
        locked_at: null,
        failed_response: failedLogs
      })
      .where(['id = ?', hookId])
      .fire();
  }
}

module.exports = NotificationHook;
