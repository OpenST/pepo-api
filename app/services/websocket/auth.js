const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  ReplayAttack = require(rootPrefix + '/lib/cacheManagement/single/ReplayAttack'),
  UserSocketConnectionDetailsModel = require(rootPrefix + '/app/models/mysql/UserSocketConnectionDetails'),
  UserSocketConDetailsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserSocketConDetailsByUserIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  base64Helper = require(rootPrefix + '/lib/base64Helper'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  configStrategy = require(rootPrefix + '/lib/providers/configStrategy'),
  socketConnectionConstants = require(rootPrefix + '/lib/globalConstant/socketConnection'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/config/configStrategy');

/**
 * Class for websocket auth.
 *
 * @class WebSocketAuth
 */
class WebSocketAuth extends ServiceBase {
  /**
   * Constructor for websocket auth.
   *
   * @param {object} params
   * @param {string} params.auth_key_expiry_at: WebSocketAuth key expiry at
   * @param {string} params.payload: Payload
   * @param {string} params.socketIdentifier: socketIdentifier
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.authKeyExpiryAt = params.auth_key_expiry_at;
    oThis.payload = params.payload;
    oThis.socketIdentifier = params.socketIdentifier;

    oThis.salt = null;
    oThis.decryptedPayload = null;
    oThis.userSocketConnectionDetails = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchConfigData();

    await oThis._checkAuthKeyValidity();

    await oThis._decryptPayload();

    await oThis._checkForReplayAttack();

    await oThis._fetchUserSocketConnection();

    await oThis._verifyAuthKeyValidity();

    await oThis._modifySocketConnectionDetails();

    return responseHelper.successWithData({
      userId: oThis.userId,
      userSocketConnDetailsId: oThis.decryptedPayload.id
    });
  }

  /**
   * This functions fetches config related to be used later in the file.
   *
   * @sets oThis.salt
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchConfigData() {
    const oThis = this;

    const constantsRsp = await configStrategy.getConfigForKind(configStrategyConstants.websocket);
    if (constantsRsp.isFailure()) {
      return Promise.reject(constantsRsp);
    }

    oThis.salt = constantsRsp.data[configStrategyConstants.websocket].wsAuthSalt;
  }

  /**
   * Checks if the auth key is valid when this request was made.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _checkAuthKeyValidity() {
    const oThis = this;

    const currentTimeStamp = basicHelper.getCurrentTimestampInSeconds();

    if (oThis.authKeyExpiryAt < currentTimeStamp) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_ws_a_1',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {
            authKeyExpiryAt: oThis.authKeyExpiryAt,
            currentTimeStamp: currentTimeStamp
          }
        })
      );
    }
  }

  /**
   * Decrypt payload.
   *
   * @sets oThis.decryptedPayload, oThis.userId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _decryptPayload() {
    const oThis = this;

    const base64DecodedPayload = base64Helper.decode(oThis.payload),
      decryptedPayload = localCipher.decrypt(oThis.salt, base64DecodedPayload);

    try {
      oThis.decryptedPayload = JSON.parse(decryptedPayload);
    } catch (err) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_ws_a_2',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {
            err: err
          }
        })
      );
    }

    oThis.userId = oThis.decryptedPayload.user_id;
  }

  /**
   * Check replay attack.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _checkForReplayAttack() {
    const oThis = this;

    const replayAttackCacheResponse = await new ReplayAttack({ authKey: oThis.decryptedPayload.auth_key }).fetch();

    if (replayAttackCacheResponse.isFailure()) {
      logger.log('Replay attack detected !!');

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_ws_a_cfra_1',
          api_error_identifier: 'could_not_proceed',
          debug_options: {
            authKey: oThis.decryptedPayload.auth_key
          }
        })
      );
    }
  }

  /**
   * Fetch user socket connection.
   *
   * @sets oThis.userSocketConnectionDetails
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUserSocketConnection() {
    const oThis = this;

    const cacheRsp = await new UserSocketConDetailsByUserIdsCache({ userIds: [oThis.userId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    // Reject if the no entry is found for user id.
    if (!cacheRsp.data[oThis.userId].id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_ws_a_3',
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
   * Verify auth key validity.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _verifyAuthKeyValidity() {
    const oThis = this;

    // If auth key is expired or auth key doesn't matches.
    if (
      basicHelper.getCurrentTimestampInSeconds() > oThis.userSocketConnectionDetails.authKeyExpiryAt ||
      oThis.decryptedPayload.auth_key !== oThis.userSocketConnectionDetails.authKey
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_ws_a_4',
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
        auth_key_expiry_at: null,
        socket_identifier: oThis.socketIdentifier,
        status: socketConnectionConstants.invertedStatuses[socketConnectionConstants.connectedStatus]
      })
      .where({
        user_id: oThis.userId,
        auth_key: oThis.decryptedPayload.auth_key
      })
      .fire();

    await UserSocketConnectionDetailsModel.flushCache({ userIds: [oThis.userId] });
  }
}

module.exports = WebSocketAuth;
