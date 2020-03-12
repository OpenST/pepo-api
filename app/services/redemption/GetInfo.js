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
  webPageConstants = require(rootPrefix + '/lib/globalConstant/webPage');

/**
 * Class to get redemption info.
 *
 * @class GetRedemptionInfo
 */
class GetRedemptionInfo extends ServiceBase {
  /**
   * Constructor to get redemption info.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {string} params.pepo_device_os
   * @param {string} params.pepo_device_os_version
   * @param {string} params.pepo_build_number
   * @param {string} params.pepo_app_version
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUser = params.current_user;

    oThis.pepoDeviceOs = params.pepo_device_os;
    oThis.pepoDeviceOsVersion = params.pepo_device_os_version;
    oThis.pepoBuildNumber = params.pepo_build_number;
    oThis.pepoAppVersion = params.pepo_app_version;
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

    const params = {
      url: webPageConstants.redemptionProductLink,
      urlToken: urlToken,
      options: {
        pdo: oThis.pepoDeviceOs,
        pdov: oThis.pepoDeviceOsVersion,
        pbn: oThis.pepoBuildNumber,
        pav: oThis.pepoAppVersion
      }
    };

    const link = webPageConstants._generateRedemptionUrl(params);

    const redemptionInfo = {
      id: 1,
      url: link,
      uts: parseInt(Date.now() / 1000)
    };

    return responseHelper.successWithData({ redemptionInfo: redemptionInfo });
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
          internal_error_identifier: 'a_s_r_gi_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_active'],
          debug_options: {}
        })
      );
    }

    const decryptedEncryptionSalt = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, secureUserObj.encryptionSaltLc);

    return new UserModel().getCookieValueFor(secureUserObj, decryptedEncryptionSalt, {
      timestamp: Date.now() / 1000,
      //source shall be store
      apiSource: apiSourceConstants.store
    });
  }
}

module.exports = GetRedemptionInfo;
