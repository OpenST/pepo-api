const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  firebaseAdminSdkWrapper = require(rootPrefix + '/lib/pushNotification/firebase/adminSdk'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
  UserDeviceByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceByUserIds');

/**
 * Constructor for base class for user notification sender.
 *
 * @class NotificationSender
 */
class NotificationSender {
  /**
   * Constructor for base class for user notification sender.
   *
   * @param params
   */
  constructor(params) {
    const oThis = this;

    oThis.userIds = params.userIds;
    oThis.rawPayload = params.rawNotificationPayload;

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

      let registrationTokens = [];

      for (let i = 0; i < currentUserIds.length; i++) {
        registrationTokens.push(oThis.userDeviceDetails[currentUserIds[i]].deviceToken);
      }

      promiseArray.push(firebaseAdminSdkWrapper.sendMulticastNotification(registrationTokens, oThis.payload));
    }

    return Promise.all(promiseArray);
  }

  /**
   * Format payload.
   *
   * @Sets oThis.payload
   *
   * @private
   */
  _formatPayload() {
    const oThis = this;

    // need discussion.
    // https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages
    // use go_to.

    oThis.payload = {
      title: oThis.rawPayload,
      body: oThis.rawPayload,
      image: oThis.rawPayload
    };
  }
}

module.exports = NotificationSender;
