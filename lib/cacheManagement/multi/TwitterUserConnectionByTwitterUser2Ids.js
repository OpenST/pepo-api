const rootPrefix = '../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  TwitterUserConnectionModel = require(rootPrefix + '/app/models/mysql/TwitterUserConnection'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get Twitter User Connections from cache using twitterUser2Ids and twitterUser1Id.
 *
 * @class TwitterUserConnectionByTwitterUser2Ids
 */
class TwitterUserConnectionByTwitterUser2Ids extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {number} params.twitterUser1Id
   * @param {array} params.twitterUser2Ids
   *
   * @sets oThis.twitterUser1Id, oThis.twitterUser2Ids
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.twitterUser1Id = params.twitterUser1Id;
    oThis.twitterUser2Ids = params.twitterUser2Ids;
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

    oThis.cacheType = cacheManagementConst.memcached;
  }

  /**
   * Set cache expiry in oThis.cacheExpiry.
   *
   * @sets oThis.cacheExpiry
   */
  _setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval; // 24 hours ;
  }

  /**
   * Set cache keys.
   *
   * @sets oThis.cacheKeys
   */
  _setCacheKeys() {
    const oThis = this;

    for (let index = 0; index < oThis.twitterUser2Ids.length; index++) {
      oThis.cacheKeys[
        oThis._cacheKeyPrefix() + '_cmm_tuc_tu1id_' + oThis.twitterUser1Id + '_tu2id_' + oThis.twitterUser2Ids[index]
      ] =
        oThis.twitterUser2Ids[index];
    }
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it.
   *
   * @sets oThis.cacheExpiry
   *
   * @returns {number}
   */
  setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source for cache miss ids
   *
   * @param cacheMissIds
   *
   * @return {Promise<*>}
   */
  async fetchDataFromSource(cacheMissIds) {
    const oThis = this;

    // This value is only returned if cache is not set.
    const twitterUserConnectionByTwitterUser2Objs = await new TwitterUserConnectionModel().fetchTwitterUserConnectionByTwitterUser1IdAndTwitterUser2Ids(
      cacheMissIds,
      oThis.twitterUser1Id
    );

    return responseHelper.successWithData(twitterUserConnectionByTwitterUser2Objs);
  }
}

module.exports = TwitterUserConnectionByTwitterUser2Ids;
