const rootPrefix = '../../..',
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  ExternalEntityModel = require(rootPrefix + '/app/models/mysql/ExternalEntity'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get external entities from cache using entity id.
 *
 * @class ExternalEntitiyByEntityIdAndEntityKind
 */
class ExternalEntitiyByEntityIdAndEntityKind extends CacheSingleBase {
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

    oThis.cacheKey =
      oThis._cacheKeyPrefix() + `_external_entities_by_entity_id_and_entity_kind_${oThis.entityId}_${oThis.entityKind}`;

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

    // This value is only returned if cache is not set.
    let externalEntitiesObj = await new ExternalEntityModel().fetchByEntityKindAndEntityId(
      oThis.entityKind,
      oThis.entityId
    );

    if (externalEntitiesObj.id) {
      return responseHelper.successWithData(externalEntitiesObj);
    }

    return responseHelper.successWithData(null);
  }
}

module.exports = ExternalEntitiyByEntityIdAndEntityKind;
