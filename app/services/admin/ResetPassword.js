/**
 * Module to reset Admin password
 *
 * @module app/services/admin/ResetPassword
 */
const rootPrefix = '../../..',
  KmsWrapper = require(rootPrefix + '/lib/aws/KmsWrapper'),
  kmsConstants = require(rootPrefix + '/lib/globalConstant/kms'),
  util = require(rootPrefix + '/lib/util'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  AdminEmailCache = require(rootPrefix + '/lib/cacheManagement/single/AdminByEmail'),
  AdminModel = require(rootPrefix + '/app/models/mysql/Admin'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to authenticate admin login
 *
 */
class AdminResetPassword extends ServiceBase {
  /**
   * Constructor for admin login
   *
   * @param {object} params
   * @param {string} params.email: Email
   * @param {string} params.name: Name
   * @param {string} params.password: Password
   *
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.email = params.email;
    oThis.name = params.name;

    oThis.adminObj = null;
    oThis.password = null;
    oThis.encryptionSalt = null;
    oThis.encryptedPassword = null;
  }

  /**
   * Async perform class
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchUser();

    await oThis._createPassword();

    await oThis._addUpdateAdmin();

    return responseHelper.successWithData({ password: oThis.password });
  }

  /**
   * Fetch admin user if present
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUser() {
    const oThis = this;

    let cacheResp = await new AdminEmailCache({ email: oThis.email }).fetch();

    oThis.adminObj = cacheResp.data[oThis.email] || {};
  }

  /**
   * create new password for admin
   *
   * @sets oThis.password
   * @returns {Promise<never>}
   * @private
   */
  async _createPassword() {
    const oThis = this;

    oThis.password = util.createRandomString();

    const kmsObject = new KmsWrapper(kmsConstants.userPasswordEncryptionPurpose),
      kmsResp = await kmsObject.generateDataKey();

    oThis.encryptionSalt = kmsResp.CiphertextBlob;

    oThis.encryptedPassword = util.createSha256Digest(kmsResp.Plaintext, oThis.password);
  }

  /**
   * Add update admin
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _addUpdateAdmin() {
    const oThis = this;

    if (CommonValidators.validateNonEmptyObject(oThis.adminObj)) {
      await new AdminModel()
        .update({ password: oThis.encryptedPassword, encryption_salt: oThis.encryptionSalt })
        .where({ id: oThis.adminObj.id })
        .fire();
    } else {
      await new AdminModel()
        .insert({
          name: oThis.name,
          email: oThis.email,
          password: oThis.encryptedPassword,
          encryption_salt: oThis.encryptionSalt,
          status: adminConstants.invertedStatuses[adminConstants.activeStatus]
        })
        .fire();
    }

    await AdminModel.flushCache({ id: oThis.adminObj.id, email: oThis.email });
  }
}

module.exports = AdminResetPassword;
