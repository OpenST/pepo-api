const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  UserSocketConnectionDetailsModel = require(rootPrefix + '/app/models/mysql/UserSocketConnectionDetails'),
  UserSocketConDetailsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserSocketConDetailsByUserIds'),
  util = require(rootPrefix + '/lib/util'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  base64Helper = require(rootPrefix + '/lib/base64Helper'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  configStrategy = require(rootPrefix + '/lib/providers/configStrategy'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy'),
  socketConnectionConstants = require(rootPrefix + '/lib/globalConstant/socketConnection');

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

    await oThis._fetchConfigData();

    let promiseArray = [];
    promiseArray.push(oThis._createAuthKey());
    promiseArray.push(oThis._fetchAndSetEndPointIdentifier());

    await Promise.all(promiseArray);

    await oThis._insertInUserConnectionDetails();

    return responseHelper.successWithData({ websocketConnectionPayload: oThis._formattedResponse() });
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
   * Creates auth key
   *
   * @private
   */
  async _createAuthKey() {
    const oThis = this;
    await oThis._fetchUser();

    let cookieToken = oThis.userData.cookieToken,
      currentTimeStamp = basicHelper.getCurrentTimestampInSeconds(),
      stringToEncrypt = oThis.userId + cookieToken + currentTimeStamp;

    oThis.authKey = util.createMd5Digest(stringToEncrypt);
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
   * Fetch websocket endpoint
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAndSetEndPointIdentifier() {
    const oThis = this;

    oThis.socketEndPointIdentifier = Math.floor(Math.random() * oThis.webSocketsServerArray.length);
    oThis.socketEndPoint = oThis.webSocketsServerArray[oThis.socketEndPointIdentifier];
  }

  /**
   * This functions fetches config related to be used later in the file.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchConfigData() {
    const oThis = this;

    let constantsRsp = await configStrategy.getConfigForKind(configStrategyConstants.constants);
    oThis.salt = constantsRsp.data.constants.salt;

    let webSocketServerConfigRsp = await configStrategy.getConfigForKind(configStrategyConstants.webSocketConnections);
    oThis.webSocketsServerArray = webSocketServerConfigRsp.data.webSocketConnections.endpoints;
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
      auth_key_expiry_at: oThis._authKeyExpiryAt,
      status: socketConnectionConstants.invertedStatuses[socketConnectionConstants.created],
      expiry_at: null,
      created_at: basicHelper.getCurrentTimestampInSeconds(),
      updated_at: basicHelper.getCurrentTimestampInSeconds()
    };

    let insertResponse = await new UserSocketConnectionDetailsModel().insert(insertObject).fire();
    insertObject.id = insertResponse.insertId;

    oThis.userSocketConnectionDetails = new UserSocketConnectionDetailsModel().formatDbData(insertObject);

    await UserSocketConnectionDetailsModel.flushCache(oThis.userSocketConnectionDetails);
  }

  /**
   * auth key expiry at
   *
   * @returns {number}
   * @private
   */
  get _authKeyExpiryAt() {
    return basicHelper.getCurrentTimestampInSeconds() + 30;
  }

  /**
   * prepare encrypted payload
   *
   * @private
   */
  _prepareEncryptedPayload() {
    const oThis = this;

    let payload = {
      user_id: oThis.userId,
      websocket_connection_id: oThis.userSocketConnectionDetails,
      auth_key: oThis.authKey
    };

    let aesEncryptedData = localCipher.encrypt(oThis.salt, JSON.stringify(payload));

    return base64Helper.encode(aesEncryptedData);
  }

  /**
   * This function returns formatted response.
   *
   * @private
   */
  _formattedResponse() {
    const oThis = this;

    let encryptedPayload = oThis._prepareEncryptedPayload(),
      response = {
        id: oThis.userSocketConnectionDetails.id,
        uts: oThis.userSocketConnectionDetails.updatedAt,
        socketEndPoint: oThis.socketEndPoint,
        payload: encryptedPayload
      };

    return response;
  }
}

module.exports = SocketConnectionDetails;
