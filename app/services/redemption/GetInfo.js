const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  base64Helper = require(rootPrefix + '/lib/base64Helper'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  pageConstants = require(rootPrefix + '/lib/globalConstant/webPage');

class GetRedemptionInfo extends ServiceBase {
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.currentUser = params.current_user;
  }

  /**
   * async perform
   *
   * @return {Promise<any>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    let token = await oThis._getEncryptedCookieValue(),
      urlToken = base64Helper.encode(token);

    const link = `${pageConstants.redemptionProductLink}?rt=${urlToken}`;

    const redemptionInfo = {
      id: 1,
      url: link,
      uts: parseInt(Date.now() / 1000)
    };

    return Promise.resolve(responseHelper.successWithData({ redemptionInfo: redemptionInfo }));
  }

  /**
   * Get encrypted cookie value
   *
   * @return {Promise<*>}
   * @private
   */
  async _getEncryptedCookieValue() {
    const oThis = this;

    const secureUserRes = await new SecureUserCache({ id: oThis.currentUser.id }).fetch();

    if (secureUserRes.isFailure()) {
      return Promise.reject(secureUserRes);
    }

    let secureUserObj = secureUserRes.data;

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

    let decryptedEncryptionSalt = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, secureUserObj.encryptionSaltLc);

    return new UserModel().getCookieValueFor(secureUserObj, decryptedEncryptionSalt, { timestamp: Date.now() / 1000 });
  }
}

module.exports = GetRedemptionInfo;
