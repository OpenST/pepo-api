const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  UserByUserNameCache = require(rootPrefix + '/lib/cacheManagement/single/UserByUsername'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher');

/**
 * Class for login service.
 *
 * @class Login
 */
class Login extends ServiceBase {
  /**
   * Constructor for login service.
   *
   * @param {object} params
   * @param {string} params.user_name: User Name
   * @param {string} params.password: Password
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userName = params.user_name;
    oThis.password = params.password;

    oThis.userId = null;
    oThis.secureUser = null;
    oThis.tokenUser = null;
  }

  /**
   * Perform: Validate login credentials.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    // Check if username exists.
    await oThis._validateAndSanitizeParams();

    await oThis._fetchSecureUser();

    await oThis._validatePassword();

    await oThis._fetchTokenUser();

    return Promise.resolve(oThis._serviceResponse());
  }

  /**
   * Validate request.
   *
   * @sets oThis.userId
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    const userObjRes = await new UserByUserNameCache({ userName: oThis.userName }).fetch();

    if (!userObjRes.data.id) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_um_l_v_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: {}
        })
      );
    }

    oThis.userId = userObjRes.data.id;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch secure user.
   *
   * @sets oThis.secureUser
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchSecureUser() {
    const oThis = this;

    logger.log('Fetching secure user.');

    const secureUserRes = await new SecureUserCache({ id: oThis.userId }).fetch();

    oThis.secureUser = secureUserRes.data;

    if (oThis.secureUser.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_um_l_fu_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_user_name'],
          debug_options: {}
        })
      );
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch token user.
   *
   * @sets oThis.tokenUser
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    logger.log('Fetching token user.');

    const tokenUserRes = await new TokenUserDetailByUserIdsCache({ userIds: [oThis.userId] }).fetch();

    oThis.tokenUser = tokenUserRes.data[oThis.userId];

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Validate password.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validatePassword() {
    const oThis = this;

    logger.log('Validating password.');

    const decryptedEncryptionSalt = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, oThis.secureUser.encryptionSaltLc);

    const generatedEncryptedPassword = util.createSha256Digest(decryptedEncryptionSalt, oThis.password);

    if (generatedEncryptedPassword !== oThis.secureUser.password) {
      const userModelInstance = new UserModel()
        .update({
          mark_inactive_trigger_count: oThis.secureUser.markInactiveTriggerCount + 1
        })
        .where(['id = ?', oThis.secureUser.id]);

      if (oThis.secureUser.markInactiveTriggerCount + 1 >= userConstants.maxMarkInactiveTriggerCount) {
        userModelInstance.update({ status: userConstants.invertedStatuses[userConstants.inActiveStatus] });
      }

      await userModelInstance.fire();

      await UserModel.flushCache({ id: oThis.secureUser.id });

      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_um_l_vp_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_password'],
          debug_options: {}
        })
      );
    }

    if (oThis.secureUser.markInactiveTriggerCount > 0) {
      await new UserModel()
        .update({ mark_inactive_trigger_count: 0 })
        .where(['id = ?', oThis.secureUser.id])
        .fire();

      oThis.secureUser.markInactiveTriggerCount = 0;

      await UserModel.flushCache({ id: oThis.secureUser.id });
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Service response.
   *
   * @return {Promise<void>}
   * @private
   */
  async _serviceResponse() {
    const oThis = this;

    const userLoginCookieValue = new UserModel().getCookieValueFor(oThis.secureUser, {
      timestamp: Date.now() / 1000
    });

    return responseHelper.successWithData({
      user: new UserModel().safeFormattedData(oThis.secureUser),
      tokenUser: new TokenUserModel().safeFormattedData(oThis.tokenUser),
      userLoginCookieValue: userLoginCookieValue
    });
  }
}

module.exports = Login;
