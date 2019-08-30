const rootPrefix = '../..',
  UserDeviceByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceByUserIds'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  notificationResponseConfig = require(rootPrefix + '/lib/notification/config/response'),
  firebaseAdminSdkWrapper = require(rootPrefix + '/lib/pushNotification/firebase/adminSdk'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook');

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
    oThis.eventType = params.eventType;

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

    return oThis._batchSendNotifications();
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
   * Send Batch Notifications.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _batchSendNotifications() {
    const oThis = this;

    let promiseArray = [];

    while (oThis.userIds.length > 0) {
      const currentUserIds = oThis.userIds.splice(0, notificationHookConstants.sdkSenderBatchSize);

      let registrationTokens = [];
      logger.step('Sending Batch Notifications for :', currentUserIds);

      for (let i = 0; i < currentUserIds.length; i++) {
        if (oThis.userDeviceDetails[currentUserIds[i]].deviceToken) {
          registrationTokens.push(oThis.userDeviceDetails[currentUserIds[i]].deviceToken);
        } else {
          logger.error('Device token not found for: ', currentUserIds[i]);
        }
      }

      promiseArray.push(firebaseAdminSdkWrapper.sendMulticastNotification(registrationTokens, oThis.messageParams));
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

    oThis.messageParams = {
      notification: {
        title: notificationResponseConfig[oThis.eventType].pushNotification.heading.title,
        body: JSON.stringify(oThis.rawPayload),
        image: 'https://d3attjoi5jlede.cloudfront.net/images/web/fav/192x192.png'
      },
      data: {
        goto: JSON.stringify(notificationResponseConfig[oThis.eventType].notificationCentre.goto)
      },
      apns: {
        payload: {
          aps: {
            'mutable-content': 1
          }
        },
        fcm_options: {
          image: 'https://cdn.dribbble.com/users/12/screenshots/4188789/ost.jpg'
        }
      }
    };
  }
}

module.exports = NotificationSender;
