/**
 * Module for caching token user data.
 *
 * @module lib/cacheManagement/shared/TokenUserByUserId
 */

const uuidV4 = require('uuid/v4');

const rootPrefix = '../..',
  CacheManagementBase = require(rootPrefix + '/lib/cacheManagement/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  TokenUserByUserIdsCache = require(rootPrefix + '/lib/cacheMultiManagement/TokenUserByUserIds');

/**
 * Class to get token user form cache.
 *
 * @class UserDetails
 */
class UserDetails extends CacheManagementBase {
  /**
   * Constructor to get token user form cache.
   *
   * @param {object} params
   *
   * @augments CacheManagementBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.tokenId = 1043;
    oThis.limit = params.limit;
    oThis.page = params.page;

    oThis.baseCacheKey = null;

    oThis.cacheType = cacheManagementConst.memcached;
    oThis.consistentBehavior = '1';
    oThis.useObject = false;

    // Call sub class method to set cache key using params provided.
    oThis._setBaseCacheKey();

    // Call sub class method to set cache expiry using params provided.
    oThis.setCacheExpiry();

    // Call sub class method to set cache implementer using params provided.
    oThis.setCacheImplementer();
  }

  /**
   * Fetch
   *
   * @return {Promise<*>}
   */
  async fetch() {
    const oThis = this;

    await oThis._setCacheKey();

    return super.fetch();
  }

  /**
   * set cache key
   *
   * @return {String}
   */
  async _setCacheKey() {
    const oThis = this;

    // cache hit for version
    let versionCacheResponse = await oThis.cacheImplementer.getObject(oThis._versionCacheKey);

    let versionDetail = null;

    if (versionCacheResponse.isSuccess() && versionCacheResponse.data.response != null) {
      versionDetail = versionCacheResponse.data.response;
    }

    if (!versionDetail || versionCacheResponse.isFailure() || versionDetail.limit !== oThis.limit) {
      // set version cache
      versionDetail = {
        v: uuidV4(),
        limit: oThis.limit
      };

      // NOTE: Set this key only on page one. If it's set on every page request. There is a possibility of some data
      // not being included in any page
      if (Number(oThis.page) === 1) {
        await oThis.cacheImplementer.setObject(oThis._versionCacheKey, versionDetail, oThis.cacheExpiry);
      }
    }

    oThis.cacheKey = oThis.baseCacheKey + '_' + versionDetail.v + '_' + oThis.page;
  }

  /**
   * Set base cache key
   *
   * @private
   */
  _setBaseCacheKey() {
    const oThis = this;

    oThis.baseCacheKey = oThis._cacheKeyPrefix() + '_ud';
  }

  /**
   * Set base cache key
   *
   * @private
   */
  get _versionCacheKey() {
    const oThis = this;

    return oThis.baseCacheKey + '_v';
  }

  /**
   * Delete the cache entry
   *
   * @returns {Promise<*>}
   */
  clear() {
    const oThis = this;

    return oThis.cacheImplementer.del(oThis._versionCacheKey);
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

    oThis.cacheExpiry = cacheManagementConst.mediumExpiryTimeInterval;

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
    let fetchUserIdsRsp = await new UserModel().fetchUserIds({
        limit: oThis.limit,
        page: oThis.page
      }),
      userIdToUserDetailsMap = fetchUserIdsRsp.data;

    let userIds = Object.keys(userIdToUserDetailsMap),
      finalResponse = {};

    const tokenUserByUserIdsCacheRsp = await new TokenUserByUserIdsCache({ userIds: userIds }).fetch(),
      userIdToTokenUserDetailsMap = tokenUserByUserIdsCacheRsp.data;

    for (let i = 0; i < userIds.length; i++) {
      let userId = userIds[i];

      finalResponse[userId] = userIdToTokenUserDetailsMap[userId];
      finalResponse[userId]['userName'] = userIdToUserDetailsMap[userId].userName;
      finalResponse[userId]['firstName'] = userIdToUserDetailsMap[userId].firstName;
      finalResponse[userId]['lastName'] = userIdToUserDetailsMap[userId].lastName;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UserDetails;
