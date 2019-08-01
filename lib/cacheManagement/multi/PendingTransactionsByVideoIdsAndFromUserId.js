const rootPrefix = '../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  PendingTransactionModel = require(rootPrefix + '/app/models/mysql/PendingTransaction'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get Pending Transactions from cache using videoIds and fromUserId.
 *
 * @class PendingTransactionsByVideoIdsAndFromUserId
 */
class PendingTransactionsByVideoIdsAndFromUserId extends CacheMultiBase {
  /**
   * Constructor to test cache management.
   *
   * @param {object} params
   * @param {Array} params.videoIds
   * @param {number} params.fromUserId
   *
   * @augments CacheMultiBase
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
   * @param {number} params.fromUserId
   * @param {Array} params.videoIds
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.fromUserId = params.fromUserId;
    oThis.videoIds = params.videoIds;
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
   * set cache expiry in oThis.cacheExpiry and return it
   */
  _setCacheExpiry() {
    const oThis = this;
    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval; // 24 hours ;
  }

  /**
   * set cache keys
   */
  _setCacheKeys() {
    const oThis = this;

    for (let i = 0; i < oThis.videoIds.length; i++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_pt_fuid_' + oThis.fromUserId + '_vid_' + oThis.videoIds[i]] =
        oThis.videoIds[i];
    }
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
   * Fetch data from source.
   *
   * @return {Result}
   */
  async fetchDataFromSource(cacheMissIds) {
    const oThis = this;

    // This value is only returned if cache is not set.
    const pendingTransactionByToUserObjs = await new PendingTransactionModel().fetchPendingTransactionByFromUserIdAndVideoIds(
      cacheMissIds,
      oThis.fromUserId
    );

    return responseHelper.successWithData(pendingTransactionByToUserObjs);
  }
}

module.exports = PendingTransactionsByVideoIdsAndFromUserId;
