const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  base64Helper = require(rootPrefix + '/lib/base64Helper'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
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

    const link = `${webPageConstants.redemptionProductLink}?rt=${urlToken}`;

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

    return new UserModel().getCookieValueFor(secureUserObj, decryptedEncryptionSalt, { timestamp: Date.now() / 1000 });
  }
}

module.exports = GetRedemptionInfo;
