const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  base64Helper = require(rootPrefix + '/lib/base64Helper'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  apiSourceConstants = require(rootPrefix + '/lib/globalConstant/apiSource'),
  pageConstants = require(rootPrefix + '/lib/globalConstant/webPage');

/**
 * Class to get support info.
 *
 * @class GetSupportInfo
 */
class GetSupportInfo extends ServiceBase {
  /**
   * Constructor to get support info.
   *
   * @param {object} params
   * @param {object} params.current_user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUser = params.current_user;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<any>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    const token = await oThis._getEncryptedCookieValue(),
      urlToken = base64Helper.encode(token);

    const link = `${pageConstants.supportLink}?rt=${urlToken}`;

    const supportInfo = {
      id: 1,
      url: link,
      uts: parseInt(Date.now() / 1000)
    };

    return responseHelper.successWithData({ supportInfo: supportInfo });
  }

  /**
   * Get encrypted cookie value.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _getEncryptedCookieValue() {
    const oThis = this;

    const secureUserRes = await new SecureUserCache({ id: oThis.currentUser.id }).fetch();
    if (secureUserRes.isFailure()) {
      return Promise.reject(secureUserRes);
    }

    const secureUserObj = secureUserRes.data;

    if (secureUserObj.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_s_gi_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_active'],
          debug_options: {}
        })
      );
    }

    const decryptedEncryptionSalt = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, secureUserObj.encryptionSaltLc);

    return new UserModel().getCookieValueFor(secureUserObj, decryptedEncryptionSalt, {
      timestamp: Date.now() / 1000,
      apiSource: apiSourceConstants.webView
    });
  }
}

module.exports = GetSupportInfo;
