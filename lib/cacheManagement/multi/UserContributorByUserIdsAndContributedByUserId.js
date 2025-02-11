const rootPrefix = '../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  UserContributorModel = require(rootPrefix + '/app/models/mysql/UserContributor'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get UserContributor from cache using ContributedByUserId and UserIds.
 *
 * @class UserContributorUserIdsAndContributedByUserId
 */
class UserContributorUserIdsAndContributedByUserId extends CacheMultiBase {
  /**
   * Constructor to test cache management.
   *
   * @param {object} params
   * @param {Array} params.userIds
   * @param {Array} params.contributedByUserId
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

    oThis.contributedByUserId = params.contributedByUserId;
    oThis.userIds = params.userIds;
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

    for (let i = 0; i < oThis.userIds.length; i++) {
      oThis.cacheKeys[
        oThis._cacheKeyPrefix() + '_cmm_uc_cbuid_' + oThis.contributedByUserId + '_uids_' + oThis.userIds[i]
      ] =
        oThis.userIds[i];
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

    oThis.cacheExpiry = cacheManagementConst.mediumExpiryTimeInterval;

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
    const contributedByUserObjs = await new UserContributorModel().fetchByUserIdsAndContributedByUserId(
      cacheMissIds,
      oThis.contributedByUserId
    );

    return responseHelper.successWithData(contributedByUserObjs);
  }
}

module.exports = UserContributorUserIdsAndContributedByUserId;
