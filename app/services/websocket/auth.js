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
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy'),
  socketConnectionConstants = require(rootPrefix + '/lib/globalConstant/socketConnection');

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
   * @param {string} params.auth_key_expiry_at: Auth key expiry at
   * @param {string} params.payload: Payload
   * @param {string} params.socketServerIdentifier: SocketServerIdentifier
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.authKeyExpiryAt = params.auth_key_expiry_at;
    oThis.payload = params.payload;
    oThis.socketIdentifier = params.socketIdentifier;

    oThis.salt = null;
    oThis.decryptedPayload = null;
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
   * Checks if the auth key is valid when this request was made.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _checkAuthKeyValidity() {
    const oThis = this;

    let currentTimeStamp = basicHelper.getCurrentTimestampInSeconds();
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
  }

  /**
   * Decrypt payload
   *
   * @returns {Promise<void>}
   * @private
   */
  async _decryptPayload() {
    const oThis = this;

    let base64DecodedPayload = base64Helper.decode(oThis.payload),
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
   * Check replay attack
   *
   * @returns {Promise<void>}
   * @private
   */
  async _checkForReplayAttack() {
    const oThis = this;

    let replayAttackCache = await new ReplayAttack({ authKey: oThis.decryptedPayload.auth_key }).fetch();

    if (replayAttackCache.isFailure()) {
      logger.log('Replay attack detected !!');
      return Promise.reject(replayAttackCache);
    }
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
        socket_expiry_at: basicHelper.getCurrentTimestampInSeconds() + 30 * 60,
        status: socketConnectionConstants.invertedStatuses[socketConnectionConstants.connectedStatus]
      })
      .where({
        user_id: oThis.userId,
        auth_key: oThis.decryptedPayload.auth_key
      })
      .fire();

    await UserSocketConnectionDetailsModel.flushCache({ userId: oThis.userId });
  }
}

module.exports = Auth;
