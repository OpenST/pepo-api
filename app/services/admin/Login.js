/**
 * Module to authenticate Admin login
 *
 * @module app/services/admin/Login
 */
const rootPrefix = '../../..',
  KmsWrapper = require(rootPrefix + '/lib/aws/KmsWrapper'),
  kmsConstants = require(rootPrefix + '/lib/globalConstant/kms'),
  util = require(rootPrefix + '/lib/util'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  AdminEmailCache = require(rootPrefix + '/lib/cacheManagement/single/AdminByEmail'),
  AdminModel = require(rootPrefix + '/app/models/mysql/Admin'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to authenticate admin login
 *
 */
class AdminLogin extends ServiceBase {
  /**
   * Constructor for admin login
   *
   * @param {object} params
   * @param {string} params.email: Email
   * @param {string} params.password: Password
   *
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.email = params.email;
    oThis.password = params.password;

    oThis.adminObj = null;
    oThis.cookie = null;
  }

  /**
   * Async perform class
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateUser();

    await oThis._validatePassword();

    let resp = await oThis._generateCookie();

    return responseHelper.successWithData(resp);
  }

  /**
   * Validate admin user present
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateUser() {
    const oThis = this;

    let cacheResp = await new AdminEmailCache({ email: oThis.email }).fetch();

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

    oThis.adminObj = cacheResp.data[oThis.email];
  }

  /**
   * Validate input password with DB password
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validatePassword() {
    const oThis = this;

    const kmsObject = new KmsWrapper(kmsConstants.userPasswordEncryptionPurpose),
      decryptResponse = await kmsObject.decrypt(oThis.adminObj.encryptionSalt);

    const decryptedEncryptionSalt = decryptResponse.Plaintext;

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
  }

  async _generateCookie() {
    const oThis = this;

    const formattedData = new AdminModel().safeFormattedData(oThis.adminObj);

    const adminCookie = new AdminModel().getCookieValueFor(formattedData, {
      timestamp: Date.now() / 1000
    });

    return responseHelper.successWithData({
      current_admin: formattedData,
      adminCookieValue: adminCookie
    });
  }
}

module.exports = AdminLogin;
