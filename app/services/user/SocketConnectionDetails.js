const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  UserSocketConnectionDetailsModel = require(rootPrefix + '/app/models/mysql/UserSocketConnectionDetails'),
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
   * @param params.current_user {Object} - current user
   * @param params.current_user.id {String} - current user id
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userId = params.user_id;
    oThis.currentUserId = params.current_user.id;

    oThis.authKey = null;
    oThis.userData = null;
    oThis.endpoint = null;
    oThis.protocol = null;
  }

  /**
   * Perform
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
    let promiseArray = [];

    promiseArray.push(oThis._fetchConfigData());

    promiseArray.push(oThis._fetchUser());

    await Promise.all(promiseArray);

    await oThis._createAuthKey();

    await oThis._insertInUserConnectionDetails();

    return responseHelper.successWithData({ websocketConnectionPayload: oThis._formattedResponse() });
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
    if (constantsRsp.isFailure()) {
      return Promise.reject(constantsRsp);
    }
    oThis.salt = constantsRsp.data[configStrategyConstants.constants].salt;

    let websocketConstants = constantsRsp.data[configStrategyConstants.constants].websocket;
    oThis.endpoint = websocketConstants.endpoint;
    oThis.protocol = websocketConstants.protocol;
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

    let cookieToken = oThis.userData.cookieToken,
      currentTimeStamp = basicHelper.getCurrentTimestampInSeconds(),
      stringToEncrypt = oThis.userId + cookieToken + currentTimeStamp;

    oThis.authKey = util.createMd5Digest(stringToEncrypt);
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
      socket_identifier: null,
      auth_key_expiry_at: oThis._authKeyExpiryAt,
      status: socketConnectionConstants.invertedStatuses[socketConnectionConstants.createdStatus],
      socket_expiry_at: null,
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
    return basicHelper.getCurrentTimestampInSeconds() + 3000;
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
        websocketEndpoint: {
          id: oThis.userSocketConnectionDetails.id,
          uts: oThis.userSocketConnectionDetails.updatedAt,
          endpoint: oThis.endpoint,
          protocol: oThis.protocol
        },
        authKeyExpiryAt: oThis.userSocketConnectionDetails.authKeyExpiryAt,
        payload: encryptedPayload
      };

    return response;
  }

  /**
   * prepare encrypted payload
   *
   * @private
   */
  _prepareEncryptedPayload() {
    const oThis = this;

    let payload = {
      id: oThis.userSocketConnectionDetails.id,
      auth_key: oThis.authKey,
      user_id: oThis.userId
    };

    let aesEncryptedData = localCipher.encrypt(oThis.salt, JSON.stringify(payload));

    return base64Helper.encode(aesEncryptedData);
  }
}

module.exports = SocketConnectionDetails;
