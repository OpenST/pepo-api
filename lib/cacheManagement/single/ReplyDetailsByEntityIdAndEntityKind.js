const rootPrefix = '../../..',
  ReplyDetailModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get reply details by entity id and entity kind from cache using entity id.
 *
 * @class ReplyDetailsByEntityIdAndEntityKind
 */
class ReplyDetailsByEntityIdAndEntityKind extends CacheSingleBase {
  /**
   * Constructor to test cache management.
   *
   * @param {object} params
   * @param {String} params.entityId
   * @param {String} params.entityKind
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

    oThis.entityId = params.entityId;
    oThis.entityKind = params.entityKind;
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

    oThis.useObject = true;
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

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_cmm_eid_${oThis.entityId}_ek_${oThis.entityKind}`;

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
   * Fetch data from source
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    let fetchByUserIdsRsp = await new ReplyDetailModel().fetchReplyDetailByEntityIdAndEntityKind({
      entityId: oThis.entityId,
      entityKind: oThis.entityKind
    });

    return responseHelper.successWithData(fetchByUserIdsRsp);
  }
}

module.exports = ReplyDetailsByEntityIdAndEntityKind;
