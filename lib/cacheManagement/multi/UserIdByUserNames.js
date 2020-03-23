const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for user by user names cache.
 *
 * @class UserIdByUserNames
 */
class UserIdByUserNames extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {array<string>} params.userNames
   *
   * @sets oThis.userNames
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.userNames = params.userNames;
  }

  /**
   * Set cache type.
   *
   * @sets oThis.cacheType
   *
   * @returns {string}
   */
  _setCacheType() {
    const oThis = this;

    oThis.cacheType = cacheManagementConstants.memcached;
  }

  /**
   * Set cache keys.
   *
   * @sets oThis.cacheKeys
   *
   * @private
   */
  _setCacheKeys() {
    const oThis = this;

    for (let index = 0; index < oThis.userNames.length; index++) {
      let userName = oThis.userNames[index];

      if (CommonValidators.validateString(userName) || CommonValidators.validateInteger(userName)) {
        userName = escape(userName);
        oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_ubun_' + userName] = userName;
      } else {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'l_cm_m_ubun_sck_1',
            api_error_identifier: 'invalid_params'
          })
        );
      }
    }
  }

  /**
   * Set cache expiry in oThis.cacheExpiry.
   *
   * @sets oThis.cacheExpiry
   *
   * @private
   */
  _setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConstants.largeExpiryTimeInterval; // 24 hours ;
  }

  /**
   * Fetch data from source for cache miss ids
   *
   * @param cacheMissIds
   *
   * @return {Promise<*>}
   */
  async fetchDataFromSource(cacheMissIds) {
    const userIdsByUserNames = await new UserModel().fetchByUserNames(cacheMissIds);

    return responseHelper.successWithData(userIdsByUserNames);
  }
}

module.exports = UserIdByUserNames;
