const rootPrefix = '../../..',
  KmsWrapper = require(rootPrefix + '/lib/aws/KmsWrapper'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  AdminModel = require(rootPrefix + '/app/models/mysql/Admin'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  AdminEmailCache = require(rootPrefix + '/lib/cacheManagement/single/AdminByEmail'),
  util = require(rootPrefix + '/lib/util'),
  kmsConstants = require(rootPrefix + '/lib/globalConstant/kms'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin');

/**
 * Class to reset admin password.
 *
 * @class AdminResetPassword
 */
class AdminResetPassword extends ServiceBase {
  /**
   * Constructor to reset admin password.
   *
   * @param {object} params
   * @param {string} params.email: Email
   * @param {string} params.name: Name
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.email = params.email;
    oThis.name = params.name;

    oThis.adminObj = null;
    oThis.password = null;
    oThis.encryptionSalt = null;
    oThis.encryptedPassword = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
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
   * Fetch admin user.
   *
   * @sets oThis.adminObj
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUser() {
    const oThis = this;

    const cacheResp = await new AdminEmailCache({ email: oThis.email }).fetch();

    oThis.adminObj = cacheResp.data[oThis.email] || {};
  }

  /**
   * Create new password for admin.
   *
   * @sets oThis.password, oThis.encryptionSalt, oThis.encryptedPassword
   *
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
   * Add or update admin.
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
