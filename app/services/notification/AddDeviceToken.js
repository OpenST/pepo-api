const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  ResetBadge = require(rootPrefix + '/app/services/user/ResetBadge'),
  UserDeviceModel = require(rootPrefix + '/app/models/mysql/UserDevice'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  UserDeviceByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceByIds'),
  LocationByTimeZoneCache = require(rootPrefix + '/lib/cacheManagement/single/LocationByTimeZone'),
  UserProfileElementsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  UserDeviceByUserIdDeviceTokenCache = require(rootPrefix +
    '/lib/cacheManagement/single/UserDeviceByUserIdDeviceToken'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  userDeviceConstants = require(rootPrefix + '/lib/globalConstant/userDevice'),
  userProfileElementConstants = require(rootPrefix + '/lib/globalConstant/userProfileElement');

/**
 * Class to add device token.
 *
 * @class AddDeviceToken
 */
class AddDeviceToken extends ServiceBase {
  /**
   * Constructor to add device token.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number} params.current_user.id
   * @param {number} params.device_id
   * @param {string} params.device_kind
   * @param {string} params.device_token
   * @param {string} params.user_timezone
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserId = +params.current_user.id;
    oThis.deviceId = params.device_id;
    oThis.deviceKind = params.device_kind;
    oThis.deviceToken = params.device_token;
    oThis.userTimeZone = params.user_timezone;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    const promiseArray = [
      oThis._insertIntoUserDevices(),
      oThis._addLocationInUserProfileElements(),
      oThis._resetUnreadNotificationsCount()
    ];
    await Promise.all(promiseArray);

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize params.
   *
   * @sets oThis.deviceKind, oThis.userTimeZone
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    oThis.deviceKind = oThis.deviceKind.toUpperCase();
    oThis.userTimeZone = oThis.userTimeZone.toLowerCase();

    if (!userDeviceConstants.invertedUserDeviceKinds[oThis.deviceKind]) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_adt_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_device_kind'],
          debug_options: { deviceKind: oThis.deviceKind }
        })
      );
    }
  }

  /**
   * Insert into user devices table.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _insertIntoUserDevices() {
    const oThis = this;

    const userDeviceIdsCacheRsp = await new UserDeviceByUserIdDeviceTokenCache({
      userId: oThis.currentUserId,
      deviceToken: oThis.deviceToken
    }).fetch();
    if (userDeviceIdsCacheRsp.isFailure()) {
      return Promise.reject(userDeviceIdsCacheRsp);
    }

    const userDeviceCacheData = userDeviceIdsCacheRsp.data[oThis.deviceToken];

    if (userDeviceCacheData && userDeviceCacheData.id) {
      const userDevicesResponse = await new UserDeviceByIdsCache({ ids: [userDeviceCacheData.id] }).fetch();
      if (userDevicesResponse.isFailure()) {
        return Promise.reject(userDevicesResponse);
      }

      const userDeviceObj = userDevicesResponse.data[userDeviceCacheData.id];

      if (userDeviceObj.status !== userDeviceConstants.activeStatus || userDeviceObj.deviceId != oThis.deviceId) {
        await new UserDeviceModel()
          .update({
            status: userDeviceConstants.invertedStatuses[userDeviceConstants.activeStatus],
            device_id: oThis.deviceId
          })
          .where({
            id: userDeviceObj.id
          })
          .fire();

        await UserDeviceModel.flushCache(userDeviceObj);
      }

      return responseHelper.successWithData({});
    }

    const userDevices = await new UserDeviceModel()
      .select('*')
      .where({ user_id: oThis.currentUserId, device_id: oThis.deviceId })
      .fire();

    let userDeviceId = null;

    if (userDevices[0] && userDevices[0].id) {
      userDeviceId = userDevices[0].id;
    }

    if (userDeviceId) {
      await new UserDeviceModel()
        .update({
          status: userDeviceConstants.invertedStatuses[userDeviceConstants.activeStatus],
          device_token: oThis.deviceToken
        })
        .where({
          id: userDeviceId
        })
        .fire();

      await oThis._cacheFlush({ userId: oThis.currentUserId, id: userDeviceId });
    } else {
      const insertParams = {
        user_id: oThis.currentUserId,
        device_id: oThis.deviceId,
        device_token: oThis.deviceToken,
        status: userDeviceConstants.invertedStatuses[userDeviceConstants.activeStatus],
        device_kind: userDeviceConstants.invertedUserDeviceKinds[oThis.deviceKind]
      };

      await new UserDeviceModel()
        .insert(insertParams)
        .fire()
        .then(async function(userDeviceInsertRsp) {
          await oThis._cacheFlush({ userId: oThis.currentUserId, id: userDeviceInsertRsp.insertId });
        })
        .catch(async function(err) {
          if (UserDeviceModel.isDuplicateIndexViolation(UserDeviceModel.userDeviceUniqueIndexName, err)) {
            // Do nothing.
          } else {
            // Insert failed due to some other reason.
            // Send error email from here.
            const errorObject = responseHelper.error({
              internal_error_identifier: 'a_s_u_adt_4',
              api_error_identifier: 'something_went_wrong',
              debug_options: { Error: err }
            });
            await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

            return Promise.reject(errorObject);
          }
        });
    }
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {integer} params.userId
   * @param {integer} params.id
   *
   * @returns {Promise<void>}
   * @private
   */
  async _cacheFlush(params) {
    await UserDeviceModel.flushCache({ userId: params.userId, id: params.id });
  }

  /**
   * Add location in user profile elements.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addLocationInUserProfileElements() {
    const oThis = this;

    const userProfileElementsCacheResp = await new UserProfileElementsByUserIdsCache({
      usersIds: [oThis.currentUserId]
    }).fetch();
    if (userProfileElementsCacheResp.isFailure()) {
      return Promise.reject(userProfileElementsCacheResp);
    }

    const userProfileElementsRspData = userProfileElementsCacheResp.data[oThis.currentUserId];

    const locationByTimeZoneCacheRsp = await new LocationByTimeZoneCache({ timeZone: oThis.userTimeZone }).fetch();
    if (locationByTimeZoneCacheRsp.isFailure()) {
      return Promise.reject(locationByTimeZoneCacheRsp);
    }

    let locationId = null;

    if (locationByTimeZoneCacheRsp.data[oThis.userTimeZone]) {
      locationId = locationByTimeZoneCacheRsp.data[oThis.userTimeZone].id;
    }

    if (!locationId) {
      // Error email.
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_u_adt_3',
        api_error_identifier: 'unknown_user_time_zone',
        debug_options: { timeZone: oThis.userTimeZone }
      });

      return createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);
    }

    logger.log('userProfileElementsRspData ===========', userProfileElementsRspData);

    const userProfileElementLocationObj = userProfileElementsRspData.locationId;

    if (userProfileElementLocationObj && userProfileElementLocationObj.id) {
      if (Number(userProfileElementLocationObj.data) === Number(locationId)) {
        return responseHelper.successWithData({});
      }
      await new UserProfileElementModel()
        .update({ data: locationId })
        .where({ id: userProfileElementLocationObj.id })
        .fire();
    } else {
      await new UserProfileElementModel().insertElement({
        userId: oThis.currentUserId,
        dataKind: userProfileElementConstants.locationIdKind,
        data: locationId
      });
    }

    return UserProfileElementModel.flushCache({ userId: oThis.currentUserId });
  }

  /**
   * Resets unread notifications counts to zero.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _resetUnreadNotificationsCount() {
    const oThis = this;

    await new ResetBadge({ current_user: { id: oThis.currentUserId }, user_id: oThis.currentUserId }).perform();
  }
}

module.exports = AddDeviceToken;
