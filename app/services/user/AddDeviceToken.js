const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  ResetBadge = require(rootPrefix + '/app/services/user/ResetBadge'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  LocationByTimeZoneCache = require(rootPrefix + '/lib/cacheManagement/single/LocationByTimeZone'),
  UserDeviceModel = require(rootPrefix + '/app/models/mysql/UserDevice'),
  UserProfileElementsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
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
   * @param {number} params.user_id
   * @param {number} params.device_id
   * @param {string} params.device_kind
   * @param {string} params.device_token
   * @param {string} params.user_timezone
   *
   * @param {number} params.current_user.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    logger.log('AddDeviceToken::params--------', params);

    oThis.currentUserId = +params.current_user.id;
    oThis.userId = +params.user_id;
    oThis.deviceId = params.device_id;
    oThis.deviceKind = params.device_kind;
    oThis.deviceToken = params.device_token;
    oThis.userTimeZone = params.user_timezone;
  }

  /**
   * Main performer for class.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this,
      promiseArray = [];

    await oThis._validateAndSanitize();

    promiseArray.push(oThis._insertIntoUserDevices());
    promiseArray.push(oThis._addLocationInUserProfileElements());
    promiseArray.push(oThis._resetUnreadNotificationsCount());

    await Promise.all(promiseArray);

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize params.
   *
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    oThis.deviceKind = oThis.deviceKind.toUpperCase();
    oThis.userTimeZone = oThis.userTimeZone.toLowerCase();

    if (oThis.currentUserId !== oThis.userId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_adt_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: { currentUserId: oThis.currentUserId }
        })
      );
    }

    if (!userDeviceConstants.invertedUserDeviceKinds[oThis.deviceKind]) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_adt_2',
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
   * @returns {Promise<void>}
   * @private
   */
  async _insertIntoUserDevices() {
    const oThis = this;

    //todo: update based on device token

    //todo: get and update and the flush cache - Done

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

      const userDeviceInsertRsp = await new UserDeviceModel().insert(insertParams).fire();

      await oThis._cacheFlush({ userId: oThis.currentUserId, id: userDeviceInsertRsp.insertId });
    }
  }

  /**
   * Flush cache.
   *
   * @param params
   * @param {integer} params.userId
   * @param {integer} params.id
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
    const oThis = this,
      userProfileElementsCacheResp = await new UserProfileElementsByUserIdsCache({
        usersIds: [oThis.currentUserId]
      }).fetch();

    if (userProfileElementsCacheResp.isFailure()) {
      return Promise.reject(userProfileElementsCacheResp);
    }

    const userProfileElementsRspdata = userProfileElementsCacheResp.data[oThis.currentUserId];

    //todo: update or insert in user profile. - Done
    //todo: locationId if blank. default insert and email - Done

    const locationByTimeZoneCacheRsp = await new LocationByTimeZoneCache({ timeZone: oThis.userTimeZone }).fetch();

    if (locationByTimeZoneCacheRsp.isFailure()) {
      return Promise.reject(locationByTimeZoneCacheRsp);
    }

    //use global constant
    let defaultLocationId = 10;

    let locationId = locationByTimeZoneCacheRsp.data[oThis.userTimeZone].id;

    if (!locationId) {
      // Error email.
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_u_adt_3',
        api_error_identifier: 'unknown_user_time_zone',
        debug_options: { timeZone: oThis.userTimeZone }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);
    }

    // If user profile elements contains location id and it is same as that of cache then return, else insert.
    if (userProfileElementsRspdata.locationId && userProfileElementsRspdata.locationId.id) {
      if (userProfileElementsRspdata.locationId.id === locationId || !locationId) {
        return responseHelper.successWithData({});
      } else if (userProfileElementsRspdata.locationId.id !== locationId) {
        await new UserProfileElementModel()
          .update({ data: locationId })
          .where({
            user_id: oThis.currentUserId,
            data_kind: userProfileElementConstants.invertedKinds[userProfileElementConstants.locationIdKind]
          })
          .fire();
      }
    } else {
      await new UserProfileElementModel().insertElement({
        userId: oThis.currentUserId,
        dataKind: userProfileElementConstants.invertedKinds[userProfileElementConstants.locationIdKind],
        data: locationId || defaultLocationId
      });
    }

    //  todo: flush cache
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
