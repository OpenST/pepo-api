const rootPrefix = '../../..',
  UserLoginModel = require(rootPrefix + '/app/models/mysql/UserLogin'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get external entities from cache using service and serviceUniqueId.
 *
 * @class UserIdByServiceAndServiceUniqueId
 */
class UserIdByServiceAndServiceUniqueId extends CacheSingleBase {
  /**
   * Constructor for UserIdByServiceAndServiceUniqueId.
   *
   * @param {object} params
   * @param {String} params.service
   * @param {String} params.serviceUniqueId
   *
   * @augments CacheSingleBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);
  }

  /**
   * Init Params in oThis
   *
   * @param params
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.service = params.service;
    oThis.serviceUniqueId = params.serviceUniqueId;
  }

  /**
   * Set use object
   *
   * @sets oThis.useObject
   *
   * @private
   */
  _setUseObject() {
    const oThis = this;

    oThis.useObject = true;
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

    oThis.cacheType = cacheManagementConst.memcached;
  }

  /**
   * Set cache key.
   *
   * @sets oThis.cacheKey
   *
   * @returns {string}
   */
  setCacheKey() {
    const oThis = this;

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_uis_ei_${oThis.service}_sui_${oThis.serviceUniqueId}`;

    return oThis.cacheKey;
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it.
   *
   * @sets oThis.cacheExpiry
   *
   * @return {number}
   */
  setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    // This value is only returned if cache is not set.
    let userIdRsp = await new UserLoginModel().getUserIdByServiceAndServiceUniqueId(
      oThis.service,
      oThis.serviceUniqueId
    );

    return responseHelper.successWithData(userIdRsp);
  }
}

module.exports = UserIdByServiceAndServiceUniqueId;
