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

    oThis.userSocketConnectionDetails = null;
  }

  /**
   * Async perform
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchUserSocketConnection();

    await oThis._verifyAuthKeyValidity();

    await oThis._modifySocketConnectionDetails();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch user socket connection
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUserSocketConnection() {
    const oThis = this;

    let cacheRsp = await new UserSocketConDetailsByUserIdsCache({ userIds: [oThis.userId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    //Reject if the no entry is found for user id.
    if (!cacheRsp.data[oThis.userId].id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_ws_a_1',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {
            userId: oThis.userId
          }
        })
      );
    }

    oThis.userSocketConnectionDetails = cacheRsp.data[oThis.userId];
  }

  /**
   * Verify auth key validity
   *
   * @returns {Promise<never>}
   * @private
   */
  async _verifyAuthKeyValidity() {
    const oThis = this;

    //If auth key is expired or auth key doesn't matches.
    if (
      basicHelper.getCurrentTimestampInSeconds() > oThis.userSocketConnectionDetails.authKeyExpiryAt ||
      oThis.authKey !== oThis.userSocketConnectionDetails.authKey
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_ws_a_2',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {
            userId: oThis.userId
          }
        })
      );
    }
  }

  /**
   * Modify socket connection details.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _modifySocketConnectionDetails() {
    const oThis = this;

    await new UserSocketConnectionDetailsModel()
      .update({
        auth_key: null,
        auth_key_expiry_at: null,
        expiry_at: basicHelper.getCurrentTimestampInSeconds() + 30 * 60
      })
      .where({
        user_id: oThis.userId
      })
      .fire();

    await UserSocketConnectionDetailsModel.flushCache({ userId: oThis.userId });
  }
}

module.exports = Auth;
