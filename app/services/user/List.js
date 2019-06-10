const rootPrefix = '../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  pagination = require(rootPrefix + '/lib/globalConstant/pagination'),
  TokenUserByUserIdCache = require(rootPrefix + '/lib/cacheManagement/UserDetails'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for User List
 *
 * @class
 */
class UserList extends ServiceBase {
  /**
   * Constructor for user list
   *
   * @param params
   *
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.limit = params.limit;
    oThis.paginationIdentifier = params[pagination.paginationIdentifierKey] || null;

    oThis.page = null;
  }

  /**
   * Async Perform
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    oThis._validateAndSanitizeParams();

    return oThis._fetchFromCache();
  }

  /**
   * Validate and sanitize specific params
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.paginationIdentifier) {
      let parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);
      oThis.page = parsedPaginationParams.page; //override page
      oThis.limit = parsedPaginationParams.limit; //override limit
    } else {
      oThis.page = 1;
      oThis.limit = oThis.limit || pagination.defaultUserListPageSize;
    }

    //Validate limit
    return await oThis._validatePageSize();
  }

  /**
   * Fetch token user details from cache
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchFromCache() {
    const oThis = this;

    const tokenUserByUserIdCache = new TokenUserByUserIdCache({
        limit: oThis.limit,
        page: oThis.page
      }),
      tokenUserByUserIdCacheRsp = await tokenUserByUserIdCache.fetch();

    if (!tokenUserByUserIdCacheRsp || tokenUserByUserIdCacheRsp.isFailure()) {
      logger.log('Could not fetch details.');
      return responseHelper.successWithData({});
    }

    return responseHelper.successWithData({
      serviceResponse: tokenUserByUserIdCacheRsp.data,
      meta: 'next_page_payload'
    });
  }

  /**
   * _defaultPageLimit
   *
   * @private
   */
  _defaultPageLimit() {
    return pagination.defaultUserListPageSize;
  }

  /**
   * _minPageLimit
   *
   * @private
   */
  _minPageLimit() {
    return pagination.minUserListPageSize;
  }

  /**
   * _maxPageLimit
   *
   * @private
   */
  _maxPageLimit() {
    return pagination.maxUserListPageSize;
  }

  /**
   * _currentPageLimit
   *
   * @private
   */
  _currentPageLimit() {
    const oThis = this;

    return oThis.limit;
  }
}

module.exports = UserList;
