const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserDeviceIdsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceIdsByUserIds'),
  TokenUserByOstUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByOstUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  commonValidator = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob');

class RecoveryInitiateOstEvent extends ServiceBase {
  /**
   * Constructor for recovery initiate ost event base.
   *
   * @param {object} params
   * @param {string} params.data: contains the webhook event data
   * @param {string} params.data.device: Transaction entity result from ost
   * @param {string} params.data.device.user_id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.recoveryEntity = params.data.device;
    oThis.ostUserId = oThis.recoveryEntity.user_id;
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._getUserIdFromOstUserIds();

    await oThis._checkIfPushNotificationRequired();

    return responseHelper.successWithData({});
  }

  /**
   * Validate request.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Start:: Validate for Recovery initiate');

    logger.log('End:: Validate for Recovery initiate');
  }

  /**
   * This function gives user id for the given ost user id(uuid).
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getUserIdFromOstUserIds() {
    const oThis = this;

    const tokenUserRsp = await new TokenUserByOstUserIdsCache({ ostUserIds: [oThis.ostUserId] }).fetch();

    if (tokenUserRsp.isFailure()) {
      return Promise.reject(tokenUserRsp);
    }

    oThis.userId = tokenUserRsp.data[oThis.ostUserId].userId;
  }

  /**
   * This function checks if push notification is required.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _checkIfPushNotificationRequired() {
    const oThis = this;

    const userDeviceCacheRsp = await new UserDeviceIdsByUserIdsCache({ userIds: [oThis.userId] }).fetch();

    if (userDeviceCacheRsp.isFailure()) {
      return Promise.reject(userDeviceCacheRsp);
    }

    const userDeviceIds = userDeviceCacheRsp.data[oThis.userId];

    if (Array.isArray(userDeviceIds) && userDeviceIds.length > 0) {
      await oThis._enqueueUserNotification();
    }
  }

  /**
   * Enqueue user notification.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueUserNotification() {
    const oThis = this;
    // Notification would be published only if user is approved.
    await notificationJobEnqueue.enqueue(notificationJobConstants.recoveryInitiate, { userId: oThis.userId });
  }
}

module.exports = RecoveryInitiateOstEvent;
