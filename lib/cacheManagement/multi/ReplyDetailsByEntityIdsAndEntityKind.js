const rootPrefix = '../../..',
  ReplyDetailModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get reply details by entity ids and entity kind from cache using entity id.
 *
 * @class ReplyDetailsByEntityIdsAndEntityKind
 */
class ReplyDetailsByEntityIdsAndEntityKind extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {array<number>} params.entityIds
   * @param {string} params.entityKind
   *
   * @sets oThis.entityIds, oThis.entityKind
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.entityIds = params.entityIds;
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
   * @private
   */
  _setCacheType() {
    const oThis = this;

    oThis.cacheType = cacheManagementConst.memcached;
  }

  /**
   * Set cache keys.
   *
   * @sets oThis.cacheKeys
   *
   * @private
   */
  _setCacheKeys() {
    const oThis = this;

    for (let ind = 0; ind < oThis.entityIds.length; ind++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + `_cmm_eid_${oThis.entityIds[ind]}_ek_${oThis.entityKind}`] =
        oThis.entityIds[ind];
    }
  }

  /**
   * Set cache expiry in oThis.cacheExpiry
   *
   * @sets oThis.cacheExpiry
   *
   * @private
   */
  _setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval; // 24 hours ;
  }

  /**
   * Fetch data from source
   *
   * @returns {result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    const fetchByUserIdsRsp = await new ReplyDetailModel().fetchReplyDetailByEntityIdsAndEntityKind({
      entityIds: oThis.entityIds,
      entityKind: oThis.entityKind
    });

    return responseHelper.successWithData(fetchByUserIdsRsp);
  }
}

module.exports = ReplyDetailsByEntityIdsAndEntityKind;
