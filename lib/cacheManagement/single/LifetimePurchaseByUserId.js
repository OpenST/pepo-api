/**
 * Multi Cache for life time purchase by user ids
 *
 *
 * @module lib/cacheManagement/single/LifetimePurchaseByUserId
 */

const rootPrefix = '../../..',
  FiatPaymentsModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  CacheManagementBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class LifetimePurchaseByUserId extends CacheManagementBase {
  /**
   * Constructor to get secure token user details by user_id.
   *
   * @param {object} params
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

    oThis.userId = params.userId;
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

    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * fetch data from source
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    let fetchByUserIdRsp = await new FiatPaymentsModel().fetchLifeTimePayments(oThis.userId),
      dataToCache = {};

    dataToCache[oThis.userId] = fetchByUserIdRsp.amount;

    return responseHelper.successWithData(dataToCache);
  }
}

module.exports = LifetimePurchaseByUserId;
