const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/big/notificationHook');

const dbName = databaseConstants.bigDbName;

/**
 * Class for notification hook model.
 *
 * @class NotificationHookModel
 */
class NotificationHookModel extends ModelBase {
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
      userDeviceIds: JSON.parse(dbRow.user_device_ids),
      rawNotificationPayload: JSON.parse(dbRow.raw_notification_payload),
      eventType: notificationHookConstants.eventTypes[dbRow.event_type],
      executionTimestamp: dbRow.execution_timestamp,
      lockIdentifier: dbRow.lock_identifier,
      lockedAt: dbRow.locked_at,
      status: notificationHookConstants.statuses[dbRow.status],
      retryCount: dbRow.retry_count,
      response: JSON.parse(dbRow.response),
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
      .where(['execution_timestamp < ?', Math.round(Date.now() / 1000)])
      .where(['retry_count <= ?', notificationHookConstants.retryLimitForFailedHooks])
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
   * Mark status as processed successfully.
   *
   * @param {number} hookId
   *
   * @returns {Promise<void>}
   */
  async markStatusAsProcessedSuccess(hookId) {
    const oThis = this;

    await oThis
      .update({
        lock_identifier: null,
        locked_at: null,
        status: notificationHookConstants.invertedStatuses[notificationHookConstants.successStatus]
      })
      .where(['id = ?', hookId])
      .fire();
  }

  /**
   * Mark failed hook as pending.
   *
   * @param {number} hookId
   *
   * @returns {Promise<void>}
   */
  async markFailedToBeRetried(hookId) {
    const oThis = this;

    await oThis
      .update({
        status: notificationHookConstants.invertedStatuses[notificationHookConstants.pendingStatus],
        lock_identifier: null,
        locked_at: null
      })
      .where(['id = ?', hookId])
      .fire();
  }
}

module.exports = NotificationHookModel;
