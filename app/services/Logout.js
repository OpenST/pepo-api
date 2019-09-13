const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserDeviceModel = require(rootPrefix + '/app/models/mysql/UserDevice'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userDeviceConstants = require(rootPrefix + '/lib/globalConstant/userDevice');

/**
 * Class for logout service.
 *
 * @class Logout
 */
class Logout extends ServiceBase {
  /**
   * Constructor for logout service.
   *
   * @param {object} params
   * @param {object} [params.current_user]
   * @param {object} [params.device_id]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUser = params.current_user;
    oThis.deviceId = params.device_id;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    return oThis._logoutUserDevices();
  }

  /**
   * Mark user devices as logout.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _logoutUserDevices() {
    const oThis = this;

    if (!oThis.deviceId || !oThis.currentUser || !oThis.currentUser.id) {
      return responseHelper.successWithData({});
    }

    const userDeviceIdResp = await new UserDeviceModel()
      .select('id')
      .where({
        user_id: oThis.currentUser.id,
        device_id: oThis.deviceId
      })
      .fire();

    let userDeviceId = null;

    if (userDeviceIdResp[0] && userDeviceIdResp[0].id) {
      userDeviceId = userDeviceIdResp[0].id;
    } else {
      return responseHelper.successWithData({});
    }

    await new UserDeviceModel()
      .update({ status: userDeviceConstants.invertedStatuses[userDeviceConstants.logoutStatus] })
      .where({
        id: userDeviceId
      })
      .fire();

    await UserDeviceModel.flushCache({ id: userDeviceId });

    return responseHelper.successWithData({});
  }
}

module.exports = Logout;
