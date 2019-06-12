const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  UserByUserNameCache = require(rootPrefix + '/lib/cacheManagement/single/UserByUsername'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class Login extends ServiceBase {
  /**
   * @param {Object} params
   * @param {String} params.user_name: User Name
   * @param {String} params.password: Password
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
   * perform - Validate Login Credentials
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    //Check if username exists
    let fetchCacheRsp = await oThis._validateAndSanitizeParams();

    await oThis._fetchUser();

    await oThis._validatePassword();

    await oThis._fetchTokenUser();

    return Promise.resolve(oThis._serviceResponse());
  }

  /**
   * Validate Request
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;
    let userObjRes = await new UserByUserNameCache({ userName: oThis.userName }).fetch();

    if (!userObjRes.data.id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_um_l_v_1',
          api_error_identifier: 'unauthorized_api_request'
        })
      );
    }

    oThis.userId = userObjRes.data.id;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch Secure user
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _fetchUser() {
    const oThis = this;
    logger.log('fetch User');

    let secureUserRes = await new SecureUserCache({ id: oThis.userId }).fetch();
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
   * Fetch Token user
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    logger.log('fetch Token User');

    let tokenUserRes = await new TokenUserDetailByUserIdsCache({ userIds: [oThis.userId] }).fetch();
    oThis.tokenUser = tokenUserRes.data[oThis.userId];

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Match Password
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _validatePassword() {
    const oThis = this;

    logger.log('Validate Password');

    let decryptedEncryptionSalt = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, oThis.secureUser.encryptionSaltLc);

    let generatedEncryptedPassword = util.createSha256Digest(decryptedEncryptionSalt, oThis.password);

    if (generatedEncryptedPassword != oThis.secureUser.password) {
      let userModelInstance = new UserModel()
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
          params_error_identifiers: ['invalid_user_name'],
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
   * Response for service
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _serviceResponse() {
    const oThis = this;

    let userLoginCookieValue = new UserModel().getCookieValueFor(oThis.secureUser, {
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
