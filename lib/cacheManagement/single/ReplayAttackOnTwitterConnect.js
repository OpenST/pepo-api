const rootPrefix = '../../..',
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to check if TwitterId was used to connect more than once in a given small amount of time
 *
 * @class ReplayAttackOnTwitterConnect
 */
class ReplayAttackOnTwitterConnect extends CacheSingleBase {
  /**
   * Constructor to get twitter connect api call times from cache using twitterId.
   *
   * @param {object} params
   * @param {String} params.twitterId
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

    oThis.twitterId = params.twitterId;
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

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_tc_tid_${oThis.twitterId}`;

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

    // check if twitterId was used to connect within 1 seconds
    oThis.cacheExpiry = 1;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch from cache
   *
   * @return {Promise<*|result>}
   */
  async fetch() {
    const oThis = this;

    await oThis._setCacheImplementer();

    logger.debug('CACHE-FETCH## lib/cacheManagement/shared/ReplayAttackOnTwitterConnect cache key: ', oThis.cacheKey);
    let count = 1;

    let data = await oThis._fetchFromCache();

    // if cache miss call sub class method to fetch data from source and set cache
    if (data) {
      count += data;
    }

    // DO NOT WAIT for cache being set
    oThis._setCache(count);
    return responseHelper.successWithData(count);
  }
}

module.exports = ReplayAttackOnTwitterConnect;
