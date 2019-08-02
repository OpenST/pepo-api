const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserCacheByIds = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  UserSocketConnectionDetailsModel = require(rootPrefix + '/app/models/mysql/UserSocketConnectionDetails'),
  UserSocketConDetailsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserSocketConDetailsByUserIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to get socket connection details
 *
 * @class
 */
class SocketConnectionDetails extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   * @param params.user_id {String} - user id
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userId = params.user_id;
    oThis.userData = null;
    oThis.authKey = null;
    oThis.socketEndPointIdentifier = null;
    oThis.socketEndPoint = null;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchSocketConnectionDetailsFromCache();
    if (!basicHelper.isEmptyObject(oThis.userSocketConnectionDetails)) {
      //Todo: Check if connection is not established for that auth key.

      await oThis._updateAuthKeyExpiry();
    } else {
      //Socket connection not found in cache. Thus create connection details and set in db.

      /**
       * 1. Create auth key,
       * 2. fetch socket endpoint identifier,
       * 3. Choose one socket identifier.
       * 4. create auth key expiry ts.
       * 5. mark expiry at as null.
       * 6. return the formatted response.
       */

      await oThis._createAuthKey();
      await oThis._fetchAndSetEndPointIdentifier();
      oThis._setAuthKeyExpiryTimestamp();
      await oThis._insertInUserConnectionDetails();
    }

    return responseHelper.successWithData({ websocketDetails: oThis._formattedResponse() });
  }

  /**
   * Fetch socket connection details from cache.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchSocketConnectionDetailsFromCache() {
    const oThis = this;

    let socketConnectionDetailsCacheRsp = await new UserSocketConDetailsByUserIdsCache({
      userIds: [oThis.userId]
    }).fetch();

    if (socketConnectionDetailsCacheRsp.isFailure()) {
      return Promise.reject(socketConnectionDetailsCacheRsp);
    }

    oThis.userSocketConnectionDetails = socketConnectionDetailsCacheRsp.data[oThis.userId];
  }

  /**
   * Fetch user
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUser() {
    const oThis = this;
    const cacheResp = await new SecureUserCache({ id: oThis.userId }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    if (!cacheResp.data.id) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_scd_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: {
            userId: oThis.userId
          }
        })
      );
    }

    oThis.userData = cacheResp.data;
  }

  /**
   * Creates auth key
   *
   * @private
   */
  async _createAuthKey() {
    const oThis = this;
    await oThis._fetchUser();

    let cookieToken = oThis.userData.cookieToken;
    //Todo: Logic to prepare auth key

    oThis.authKey = 'BHYU77343HTKGRO4680HJDKSN';
  }

  /**
   * Fetch websocket endpoint
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAndSetEndPointIdentifier() {
    const oThis = this;

    //Todo: Logic to fetch endpoint form config strategy
    oThis.socketEndPointIdentifier = 1;
    oThis.socketEndPoint = 'ws://localhost:4000';
  }

  /**
   *
   *
   * @private
   */
  _setAuthKeyExpiryTimestamp() {
    const oThis = this;

    oThis.authKeyExpiryAt = basicHelper.getCurrentTimestampInSeconds() + 30;
  }

  /**
   * Insert in user connection details.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInUserConnectionDetails() {
    const oThis = this;

    let insertObject = {
      user_id: oThis.userId,
      auth_key: oThis.authKey,
      socket_endpoint_identifier: oThis.socketEndPointIdentifier,
      auth_key_expiry_at: oThis.authKeyExpiryAt,
      created_at: basicHelper.getCurrentTimestampInSeconds(),
      updated_at: basicHelper.getCurrentTimestampInSeconds()
    };

    let insertResponse = await new UserSocketConnectionDetailsModel().insert(insertObject).fire();
    insertObject.id = insertResponse.insertId;

    oThis.userSocketConnectionDetails = new UserSocketConnectionDetailsModel().formatDbData(insertObject);

    await UserSocketConnectionDetailsModel.flushCache(oThis.userSocketConnectionDetails);
  }

  /**
   * update auth key expiry
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateAuthKeyExpiry() {
    const oThis = this;

    oThis._setAuthKeyExpiryTimestamp();

    await new UserSocketConnectionDetailsModel()
      .update({
        auth_key_expiry_at: oThis.authKeyExpiryAt
      })
      .where({
        user_id: oThis.userId
      })
      .fire();

    await UserSocketConnectionDetailsModel.flushCache(oThis.userId);
  }

  /**
   * This function returns formatted response.
   *
   * @private
   */
  _formattedResponse() {
    const oThis = this;
    let response = {
      userId: oThis.userSocketConnectionDetails.userId,
      socketEndpoint: oThis.socketEndPoint,
      authKey: oThis.userSocketConnectionDetails.authKey
    };

    return response;
  }
}

module.exports = SocketConnectionDetails;
