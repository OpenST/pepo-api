const rootPrefix = '../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get transaction from cache using ost tx ids.
 *
 * @class TransactionByOstTxId
 */
class TransactionByOstTxId extends CacheMultiBase {
  /**
   * Constructor to test cache management.
   *
   * @param {object} params
   * @param {Array} params.ostTxIds
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
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.ostTxIds = params.ostTxIds;
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
   * set cache keys
   */
  _setCacheKeys() {
    const oThis = this;

    for (let i = 0; i < oThis.ostTxIds.length; i++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_t_otxid_' + oThis.ostTxIds[i]] = oThis.ostTxIds[i];
    }
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it.
   *
   * @sets oThis.cacheExpiry
   *
   * @return {number}
   */
  _setCacheExpiry() {
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

    let transactionObj = await new TransactionModel().fetchByOstTxId(cacheMissIds);

    return responseHelper.successWithData(transactionObj);
  }
}

module.exports = TransactionByOstTxId;
