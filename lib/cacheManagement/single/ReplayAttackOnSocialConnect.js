const rootPrefix = '../../..',
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to check if TwitterId was used to connect more than once in a given small amount of time
 *
 * @class ReplayAttackOnSocialConnect
 */
class ReplayAttackOnSocialConnect extends CacheSingleBase {
  /**
   * Constructor to get twitter connect api call times from cache using twitterId.
   *
   * @param {object} params
   * @param {String} params.socialId
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

    oThis.socialId = params.socialId;
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

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_sc_sid_${oThis.socialId}`;

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
    logger.debug('CACHE-FETCH## lib/cacheManagement/shared/ReplayAttackOnSocialConnect cache key: ', oThis.cacheKey);

    return oThis.cacheImplementer.acquireLock(oThis.cacheKey, oThis.cacheExpiry);
  }
}

module.exports = ReplayAttackOnSocialConnect;
