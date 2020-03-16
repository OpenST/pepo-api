const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  AdminModel = require(rootPrefix + '/app/models/mysql/admin/Admin'),
  AdminByIdCache = require(rootPrefix + '/lib/cacheManagement/single/AdminById'),
  AdminByEmailsCache = require(rootPrefix + '/lib/cacheManagement/multi/AdminByEmails'),
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin/admin');

/**
 * Class to authenticate admin login.
 *
 * @class AdminLogin
 */
class AdminLogin extends ServiceBase {
  /**
   * Constructor to authenticate admin login.
   *
   * @param {object} params
   * @param {string} params.email: Email
   * @param {string} params.password: Password
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.email = params.email;
    oThis.password = params.password;

    oThis.adminObj = {};
    oThis.cookie = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateUser();

    await oThis._validatePassword();

    return oThis._generateCookie();
  }

  /**
   * Validate admin user.
   *
   * @sets oThis.adminObj
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateUser() {
    const oThis = this;

    const cacheResp = await new AdminByEmailsCache({ emails: [oThis.email] }).fetch();
    if (cacheResp.isFailure() || !CommonValidators.validateNonEmptyObject(cacheResp.data)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_am_l_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: {}
        })
      );
    }

    const adminId = cacheResp.data[oThis.email].id;

    if (!adminId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_am_l_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: {}
        })
      );
    }

    const adminByIdCacheResponse = await new AdminByIdCache({ id: adminId }).fetch();
    if (adminByIdCacheResponse.isFailure()) {
      return Promise.reject(adminByIdCacheResponse);
    }

    oThis.adminObj = adminByIdCacheResponse.data[adminId];
  }

  /**
   * Validate input password with DB password.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validatePassword() {
    const oThis = this;

    const decryptedEncryptionSalt = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, oThis.adminObj.encryptionSalt);

    const generatedEncryptedPassword = util.createSha256Digest(decryptedEncryptionSalt, oThis.password);

    if (generatedEncryptedPassword !== oThis.adminObj.password) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_am_l_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: {}
        })
      );
    }

    if (oThis.adminObj.status !== adminConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_am_l_3',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_active'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Generate admin cookie.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  _generateCookie() {
    const oThis = this;

    const adminCookie = new AdminModel().getCookieValueFor(oThis.adminObj, {
      timestamp: Date.now() / 1000
    });

    return responseHelper.successWithData({
      adminCookieValue: adminCookie
    });
  }
}

module.exports = AdminLogin;
