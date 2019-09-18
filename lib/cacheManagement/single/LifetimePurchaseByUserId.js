const rootPrefix = '../../..',
  FiatPaymentsModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  CacheManagementBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

class LifetimePurchaseByUserId extends CacheManagementBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {number} params.userId
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.userId = params.userId;
  }

  /**
   * Set use object.
   *
   * @sets oThis.useObject
   *
   * @private
   */
  _setUseObject() {
    const oThis = this;

    oThis.useObject = false;
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
   * Set cache key.
   *
   * @sets oThis.cacheKey
   *
   * @returns {string}
   */
  setCacheKey() {
    const oThis = this;

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_lp_ui_${oThis.userId}`;

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

    oThis.cacheExpiry = cacheManagementConstants.largeExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source.
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    const fetchByUserIdRsp = await new FiatPaymentsModel().fetchTotalPurchaseAmountFor(oThis.userId);
    const dataToCache = {};

    dataToCache[oThis.userId] = fetchByUserIdRsp.amount;

    return responseHelper.successWithData(dataToCache);
  }
}

module.exports = LifetimePurchaseByUserId;
