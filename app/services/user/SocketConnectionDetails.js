const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  UserSocketConnectionDetailsModel = require(rootPrefix + '/app/models/mysql/socket/UserSocketConnectionDetails'),
  UserSocketConnectionDetailsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserSocketConDetailsByUserIds'),
  util = require(rootPrefix + '/lib/util'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  base64Helper = require(rootPrefix + '/lib/base64Helper'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  configStrategyProvider = require(rootPrefix + '/lib/providers/configStrategy'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/config/configStrategy'),
  socketConnectionConstants = require(rootPrefix + '/lib/globalConstant/socket/socketConnection');

/**
 * Class to get socket connection details.
 *
 * @class SocketConnectionDetails
 */
class SocketConnectionDetails extends ServiceBase {
  /**
   * Constructor to get socket connection details.
   *
   * @param params
   * @param {string} params.user_id: user id
   * @param {object} params.current_user: current user
   * @param {string} params.current_user.id: current user id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userId = params.user_id;
    oThis.currentUserId = params.current_user.id;

    oThis.salt = null;
    oThis.endpoint = null;
    oThis.port = null;
    oThis.protocol = null;
    oThis.userData = null;
    oThis.authKey = null;
    oThis.userSocketConnectionDetails = null;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    if (oThis.userId !== oThis.currentUserId) {
      return responseHelper.paramValidationError({
        internal_error_identifier: 'a_s_u_scd_3',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['invalid_user_id'],
        debug_options: {
          userId: oThis.userId,
          currentUserId: oThis.currentUserId
        }
      });
    }

    const promiseArray = [oThis._fetchConfigData(), oThis._fetchUser()];
    await Promise.all(promiseArray);

    await oThis._createAuthKey();

    await oThis._insertInUserConnectionDetails();

    await oThis._setUserSocketConnectionDetailsCache();

    return responseHelper.successWithData({ websocketConnectionPayload: oThis._formattedResponse() });
  }

  /**
   * This functions fetches config related to be used later in the file.
   *
   * @sets oThis.salt, oThis.endpoint, oThis.port, oThis.protocol
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchConfigData() {
    const oThis = this;

    const constantsRsp = await configStrategyProvider.getConfigForKind(configStrategyConstants.websocket);
    if (constantsRsp.isFailure()) {
      return Promise.reject(constantsRsp);
    }

    // The config related to websocket is actually endpoint details of NLB. Behind NLB, there are multiple socket servers.
    const websocketConfig = constantsRsp.data[configStrategyConstants.websocket];
    oThis.salt = websocketConfig.wsAuthSalt;
    oThis.endpoint = websocketConfig.endpoint;
    oThis.port = websocketConfig.port;
    oThis.protocol = websocketConfig.protocol;
  }

  /**
   * Fetch user.
   *
   * @sets oThis.userData
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
   * Creates auth key.
   *
   * @sets oThis.authKey
   *
   * @private
   */
  _createAuthKey() {
    const oThis = this;

    const cookieToken = oThis.userData.cookieToken,
      currentTimeStamp = basicHelper.getCurrentTimestampInSeconds(),
      stringToEncrypt = oThis.userId + cookieToken + currentTimeStamp;

    oThis.authKey = util.createMd5Digest(stringToEncrypt);
  }

  /**
   * Insert in user connection details.
   *
   * @sets oThis.userSocketConnectionDetails
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInUserConnectionDetails() {
    const oThis = this;

    const insertObject = {
      user_id: oThis.userId,
      auth_key: oThis.authKey,
      socket_identifier: null,
      auth_key_expiry_at: oThis._authKeyExpiryAt,
      status: socketConnectionConstants.invertedStatuses[socketConnectionConstants.createdStatus],
      created_at: basicHelper.getCurrentTimestampInSeconds(),
      updated_at: basicHelper.getCurrentTimestampInSeconds()
    };

    const insertResponse = await new UserSocketConnectionDetailsModel().insert(insertObject).fire();
    insertObject.id = insertResponse.insertId;

    oThis.userSocketConnectionDetails = new UserSocketConnectionDetailsModel().formatDbData(insertObject);

    await UserSocketConnectionDetailsModel.flushCache({ userIds: [oThis.userSocketConnectionDetails.userId] });
  }

  /**
   * Sets user socket connection details.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setUserSocketConnectionDetailsCache() {
    const oThis = this,
      userId = oThis.userSocketConnectionDetails.userId,
      dataToSet = oThis.userSocketConnectionDetails;

    await new UserSocketConnectionDetailsCache({ userIds: [userId] })._setCache(userId, dataToSet);
  }

  /**
   * Auth key expiry at.
   *
   * @returns {number}
   * @private
   */
  get _authKeyExpiryAt() {
    return basicHelper.getCurrentTimestampInSeconds() + 3000;
  }

  /**
   * This function returns formatted response.
   *
   * @returns {object}
   * @private
   */
  _formattedResponse() {
    const oThis = this;

    const encryptedPayload = oThis._prepareEncryptedPayload();
    const response = {
      websocketEndpoint: {
        id: oThis.userSocketConnectionDetails.id,
        uts: oThis.userSocketConnectionDetails.updatedAt,
        endpoint: oThis.endpoint,
        port: oThis.port,
        protocol: oThis.protocol
      },
      authKeyExpiryAt: oThis.userSocketConnectionDetails.authKeyExpiryAt,
      payload: encryptedPayload
    };

    return response;
  }

  /**
   * Prepare encrypted payload.
   *
   * @returns {*}
   * @private
   */
  _prepareEncryptedPayload() {
    const oThis = this;

    const payload = {
      id: oThis.userSocketConnectionDetails.id,
      auth_key: oThis.authKey,
      user_id: oThis.userId
    };

    const aesEncryptedData = localCipher.encrypt(oThis.salt, JSON.stringify(payload));

    return base64Helper.encode(aesEncryptedData);
  }
}

module.exports = SocketConnectionDetails;
