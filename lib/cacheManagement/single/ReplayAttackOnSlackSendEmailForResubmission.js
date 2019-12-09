const rootPrefix = '../../..',
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to check if userId was used to send resubmission email more than once in a given small amount of time
 *
 * @class ReplayAttackOnSlackSendEmailForResubmission
 */
class ReplayAttackOnSlackSendEmailForResubmission extends CacheSingleBase {
  /**
   * Constructor to get send resubmission email api call times from cache using userId.
   *
   * @param {object} params
   * @param {String} params.userId
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

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_u_uid_${oThis.userId}`;

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

    // check if userId was used to connect within 3 minutes
    oThis.cacheExpiry = 3 * 60;

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
    logger.debug(
      'CACHE-FETCH## lib/cacheManagement/single/ReplayAttackOnSlackSendEmailForResubmission cache key: ',
      oThis.cacheKey
    );

    return oThis.cacheImplementer.acquireLock(oThis.cacheKey, oThis.cacheExpiry);
  }
}

module.exports = ReplayAttackOnSlackSendEmailForResubmission;
