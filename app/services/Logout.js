const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserDeviceModel = require(rootPrefix + '/app/models/mysql/UserDevice'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  userDeviceConstants = require(rootPrefix + '/lib/globalConstant/userDevice');

class Logout extends ServiceBase {
  /**
   * Constructor for Logout service.
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
    super(params);
    logger.log(' ==========   Logout params:', params);
    const oThis = this;
    oThis.currentUser = params.current_user;
    oThis.deviceId = params.device_id;
  }

  /**
   * Perform: Perform user creation.
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

    await new UserDeviceModel()
      .update({ status: userDeviceConstants.invertedStatuses[userDeviceConstants.logoutStatus] })
      .where({
        user_id: oThis.currentUser.id,
        device_id: oThis.deviceId
      })
      .fire();

    if (userDeviceIdResp && userDeviceIdResp[0] && userDeviceIdResp[0].id) {
      const userDeviceId = userDeviceIdResp[0].id;
      await UserDeviceModel.flushCache({ id: userDeviceId });
    }

    return responseHelper.successWithData({});
  }
}

module.exports = Logout;
