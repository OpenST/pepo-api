const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserDeviceModel = require(rootPrefix + '/app/models/mysql/UserDevice'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userDeviceConstants = require(rootPrefix + '/lib/globalConstant/userDevice');

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

    logger.log('params--------', params);

    oThis.currentUserId = +params.current_user.id;
    oThis.userId = +params.user_id;
    oThis.deviceId = params.device_id;
    oThis.deviceKind = params.device_kind;
    oThis.deviceToken = params.device_token;
  }

  /**
   * Main performer for class.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    await oThis._insertIntoUserDevices();

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

    return new UserDeviceModel()
      .insert(insertParams)
      .fire()
      .catch(async function(err) {
        if (UserDeviceModel.isDuplicateIndexViolation(UserDeviceModel.userDeviceUniqueIndexName, err)) {
          await new UserDeviceModel()
            .update({
              device_token: oThis.deviceToken
            })
            .where({
              user_id: oThis.currentUserId,
              device_id: oThis.deviceId
            })
            .fire();

          // Flush cache.
          await UserDeviceModel.flushCache({ userId: oThis.currentUserId });
        } else {
          return Promise.reject(err);
        }
      });
  }
}

module.exports = AddDeviceToken;
