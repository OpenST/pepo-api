const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
  UserDeviceByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceByUserIds');

/**
 * Constructor for base class for user notification sender.
 *
 * @class NotificationSenderBase
 */
class NotificationSenderBase {
  /**
   * Constructor for base class for user notification sender.
   *
   * @param params
   */
  constructor(params) {
    const oThis = this;

    oThis.userIds = params.userIds;
    oThis.rawPayload = params.pushNotificationPayload;

    oThis.payload = {};
    oThis.userDeviceDetails = {};
  }

  /**
   * Main performer method for the class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchDeviceTokens();

    oThis._formatPayload();

    await oThis._batchSendNotifications();
  }

  /**
   * Fetch device token details from cache.
   *
   * @Sets oThis.userDeviceDetails
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchDeviceTokens() {
    const oThis = this;

    const userDeviceCacheRsp = await new UserDeviceByUserIdsCache({ userIds: oThis.userIds }).fetch();

    oThis.userDeviceDetails = userDeviceCacheRsp.data;
  }

  /**
   * batch Send Notifications.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _batchSendNotifications() {
    const oThis = this;

    let promiseArray = [];

    while (oThis.userIds.length > 0) {
      const currentUserIds = oThis.userIds.splice(0, notificationHookConstants.senderBatchSize);

      promiseArray.push(oThis._sendNotification(currentUserIds));
    }

    return Promise.all(promiseArray);
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
   * Format payload.
   *
   * @Sets oThis.payload
   *
   * @private
   */
  _formatPayload() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Send Notifications.
   *
   * @param userIds
   * @returns {Promise<void>}
   * @private
   */
  async _sendNotification(userIds) {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = NotificationSenderBase;
