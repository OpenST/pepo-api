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
   * Init params in oThis.
   *
   * @param {object} params
   * @param {number} params.fromUserId
   * @param {array} params.toUserIds
   *
   * @sets oThis.fromUserId, oThis.toUserIds
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.fromUserId = params.fromUserId;
    oThis.toUserIds = params.toUserIds;
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

    for (let index = 0; index < oThis.toUserIds.length; index++) {
      oThis.cacheKeys[
        oThis._cacheKeyPrefix() + '_cmm_pt_fuid_' + oThis.fromUserId + '_tuid_' + oThis.toUserIds[index]
      ] =
        oThis.toUserIds[index];
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
   * Fetch data from source.
   *
   * @returns {Result}
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
