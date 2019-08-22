const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserDeviceModel = require(rootPrefix + '/app/models/mysql/UserDevice'),
  userDeviceConstants = require(rootPrefix + '/lib/globalConstant/userDevice'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

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

    oThis.currentUserId = +params.current_user.id;
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

    if (!userDeviceConstants.invertedUserDeviceKinds[oThis.deviceKind]) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_u_adt_1',
          api_error_identifier: 'invalid_device_type',
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
        }

        // Flush cache.
        await UserDeviceModel.flushCache({ userId: oThis.currentUserId });
      });
  }
}

module.exports = AddDeviceToken;
