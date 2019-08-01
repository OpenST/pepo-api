const rootPrefix = '../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  PendingTransactionModel = require(rootPrefix + '/app/models/mysql/PendingTransaction'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get Pending Transactions from cache using toUserIds and fromUserId.
 *
 * @class PendingTransactionsByToUserIdsAndFromUserId
 */
class PendingTransactionsByToUserIdsAndFromUserId extends CacheMultiBase {
  /**
   * Constructor to test cache management.
   *
   * @param {object} params
   * @param {Array} params.toUserIds
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
   * @param {Array} params.toUserIds
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.fromUserId = params.fromUserId;
    oThis.toUserIds = params.toUserIds;
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

    for (let i = 0; i < oThis.toUserIds.length; i++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_pt_fuid_' + oThis.fromUserId + '_tuid_' + oThis.toUserIds[i]] =
        oThis.toUserIds[i];
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
    const pendingTransactionByToUserObjs = await new PendingTransactionModel().fetchPendingTransactionByFromUserIdAndToUserIds(
      cacheMissIds,
      oThis.fromUserId
    );

    return responseHelper.successWithData(pendingTransactionByToUserObjs);
  }
}

module.exports = PendingTransactionsByToUserIdsAndFromUserId;
