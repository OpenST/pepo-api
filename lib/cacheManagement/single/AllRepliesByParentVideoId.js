const rootPrefix = '../../..',
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get all replies of a given parent video.
 *
 * @class AllRepliesByParentVideoId
 */
class AllRepliesByParentVideoId extends CacheSingleBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {string} params.parentVideoId
   *
   * @sets oThis.entityKind
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.parentVideoId = params.parentVideoId;
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

    oThis.cacheType = cacheManagementConstants.memcached;
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

    oThis.cacheKey = `${oThis._cacheKeyPrefix()}_al_re_pvid_${oThis.parentVideoId}`;

    return oThis.cacheKey;
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

    oThis.cacheExpiry = cacheManagementConstants.mediumExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source.
   *
   * @returns {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    const dbResponse = await new ReplyDetailsModel().getAllReplies(oThis.parentVideoId);
    let dataToCache = { allReplies: [] };

    // TODO bubble - shorten following keys - creatorId, replyDetailsId, replyVideoId
    // TODO bubble - use global constant for the short key names
    for (let i = 0; i < dbResponse.length; i++) {
      let objectToInsert = {
        creatorId: dbResponse[i].creatorUserId,
        replyDetailsId: dbResponse[i].id,
        replyVideoId: dbResponse[i].entityId
      };
      dataToCache.allReplies.push(objectToInsert);
    }

    return responseHelper.successWithData(dataToCache);
  }
}

module.exports = AllRepliesByParentVideoId;
