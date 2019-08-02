const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserSocketConnectionDetailsModel = require(rootPrefix + '/app/models/mysql/UserSocketConnectionDetails'),
  UserSocketConDetailsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserSocketConDetailsByUserIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for websocket auth.
 *
 * @class Auth
 */
class Auth extends ServiceBase {
  /**
   * Constructor for websocket auth
   *
   * @param {object} params
   * @param {string} params.user_id: User id
   * @param {string} params.auth_key: Auth key
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userId = params.user_id;
    oThis.authKey = params.auth_key;
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchUserSocketConnection();

    await oThis._verifyAuthKeyValidity();

    await oThis._markAuthKeyNull();

    return responseHelper.successWithData({});
  }

  async _fetchUserSocketConnection() {
    const oThis = this;

    let cacheRsp = await new UserSocketConDetailsByUserIdsCache({ userIds: [oThis.userId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    if (cacheRsp.data[oThis.userId].id) {
      return oThis._unauthorizedResponse();
    }

    oThis.userSocketConnectionDetails = cacheRsp.data[oThis.userId];
  }

  async _verifyAuthKeyValidity() {
    const oThis = this;

    if (
      basicHelper.getCurrentTimestampInSeconds() > oThis.userSocketConnectionDetails.authKeyExpiryAt ||
      oThis.authKey !== oThis.userSocketConnectionDetails.authKey
    ) {
      return oThis._unauthorizedResponse();
    }
  }

  async _markAuthKeyNull() {
    const oThis = this;

    await new UserSocketConnectionDetailsModel()
      .update({
        auth_key: null
      })
      .where({
        user_id: oThis.userId
      })
      .fire();

    await UserSocketConnectionDetailsModel.flushCache({ userId: oThis.userId });
  }

  _unauthorizedResponse() {
    const oThis = this;
    return Promise.resolve(
      responseHelper.error({
        internal_error_identifier: 'a_s_ws_a_1',
        api_error_identifier: 'unauthorized_api_request',
        debug_options: {
          userId: oThis.userId
        }
      })
    );
  }
}

module.exports = Auth;
