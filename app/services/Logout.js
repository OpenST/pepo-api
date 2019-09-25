const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserDeviceModel = require(rootPrefix + '/app/models/mysql/UserDevice'),
  UserDeviceByIds = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
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
   * @param {object} [params.deviceIds]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;
    oThis.currentUser = params.current_user;

    oThis.deviceIdArray = params.device_id ? [params.device_id] : params.deviceIds;
    oThis.deviceIdArray = oThis.deviceIdArray ? oThis.deviceIdArray : [];
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

    if (oThis.deviceIdArray.length === 0 || !oThis.currentUser || !oThis.currentUser.id) {
      return responseHelper.successWithData({});
    }

    const userDeviceIdResp = await new UserDeviceModel()
      .select('id')
      .where({
        user_id: oThis.currentUser.id,
        device_id: oThis.deviceIdArray
      })
      .fire();

    let userDeviceIds = [];

    for (let ind = 0; ind < userDeviceIdResp.length; ind++) {
      userDeviceIds.push(userDeviceIdResp[ind].id);
    }

    await new UserDeviceModel()
      .update({ status: userDeviceConstants.invertedStatuses[userDeviceConstants.logoutStatus] })
      .where({
        id: userDeviceIds
      })
      .fire();

    await new UserDeviceByIds({ ids: userDeviceIds }).clear();

    return responseHelper.successWithData({});
  }
}

module.exports = Logout;
