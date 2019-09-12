const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  LocationByTimeZoneCache = require(rootPrefix + '/lib/cacheManagement/single/LocationByTimeZone'),
  UserNotificationsCountModel = require(rootPrefix + '/app/models/cassandra/UserNotificationsCount'),
  UserDeviceModel = require(rootPrefix + '/app/models/mysql/UserDevice'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
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
      .catch(async function(err) {
        if (UserDeviceModel.isDuplicateIndexViolation(UserDeviceModel.userDeviceUniqueIndexName, err)) {
          await new UserDeviceModel()
            .update({
              status: userDeviceConstants.invertedStatuses[userDeviceConstants.activeStatus],
              device_token: oThis.deviceToken
            })
            .where({
              user_id: oThis.currentUserId,
              device_id: oThis.deviceId
            })
            .fire();
        } else {
          return Promise.reject(err);
        }
      });

    // Flush cache.
    await UserDeviceModel.flushCache({ userId: oThis.currentUserId });
  }

  /**
   * Add location in user profile elements.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addLocationInUserProfileElements() {
    const oThis = this,
      locationByTimeZoneCacheRsp = await new LocationByTimeZoneCache({ timeZone: oThis.userTimeZone }).fetch();

    if (locationByTimeZoneCacheRsp.isFailure()) {
      return Promise.reject(locationByTimeZoneCacheRsp);
    }

    const locationId = locationByTimeZoneCacheRsp.data[oThis.userTimeZone].id;

    await new UserProfileElementModel().insertElement({
      userId: oThis.currentUserId,
      dataKind: userProfileElementConstants.locationIdKind,
      data: locationId
    });
  }

  /**
   * Resets unread notifications counts to zero only in case of android.
   * As android device is not able to get the badge count.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _resetUnreadNotificationsCount() {
    const oThis = this;

    if (oThis.deviceKind === userDeviceConstants.androidDeviceKind) {
      let queryRsp = await new UserNotificationsCountModel().fetchUnreadNotificationCount({ userIds: [oThis.userId] });

      console.log('queryRsp---', queryRsp);

      return new UserNotificationsCountModel().resetUnreadNotificationCount({
        userId: oThis.userId,
        count: queryRsp[oThis.userId]
      });
    }
  }
}

module.exports = AddDeviceToken;
