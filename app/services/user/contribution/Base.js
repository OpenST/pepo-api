const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  TokenUserByUserIdsMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for user contribution base.
 *
 * @class UserContributionBase
 */
class UserContributionBase extends ServiceBase {
  /**
   * Constructor for user contribution base.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number/string} params.current_user.id
   * @param {number/string} params.profile_user_id
   * @param {string} [params.pagination_identifier]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.currentUserId = +params.current_user.id;
    oThis.profileUserId = +params.profile_user_id;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.limit = null;
    oThis.page = null;
    oThis.isProfileUserCurrentUser = oThis.profileUserId === oThis.currentUserId;

    oThis.imageIds = [];
    oThis.imageMap = {};
    oThis.contributionUserIds = [];
    oThis.usersByIdMap = {};
    oThis.contributionUsersByUserIdsMap = {};
    oThis.tokenUsersByUserIdMap = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchPaginatedUserIdsFromCache();

    const promisesArray = [];

    promisesArray.push(oThis._fetchUsers());
    promisesArray.push(oThis._fetchTokenUsers());

    await Promise.all(promisesArray);

    await oThis._fetchImages();

    return responseHelper.successWithData(oThis.finalResponse());
  }

  /**
   * Validate and sanitize specific params.
   *
   * @sets oThis.page, oThis.limit
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);
      oThis.page = parsedPaginationParams.page; // Override page.
    } else {
      oThis.page = 1;
    }
    oThis.limit = paginationConstants.defaultUserContributionPageSize;

    if (!oThis.isProfileUserCurrentUser) {
      await oThis._validateProfileUserId(oThis.profileUserId);
    }

    return oThis._validatePageSize();
  }

  /**
   * Fetch user ids from cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPaginatedUserIdsFromCache() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Fetch users from cache.
   *
   * @sets oThis.usersByIdMap, oThis.imageIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    if (oThis.contributionUserIds.length < 1) {
      return responseHelper.successWithData({});
    }

    const usersByIdHashRes = await new UserMultiCache({ ids: oThis.contributionUserIds }).fetch();

    if (usersByIdHashRes.isFailure()) {
      return Promise.reject(usersByIdHashRes);
    }

    oThis.usersByIdMap = usersByIdHashRes.data;

    for (const id in oThis.usersByIdMap) {
      const userObj = oThis.usersByIdMap[id];
      if (userObj.profileImageId) {
        oThis.imageIds.push(userObj.profileImageId);
      }
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch token user details from cache.
   *
   * @sets oThis.tokenUsersByUserIdMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTokenUsers() {
    const oThis = this;

    if (oThis.contributionUserIds.length < 1) {
      return responseHelper.successWithData({});
    }

    const tokenUsersByIdHashRes = await new TokenUserByUserIdsMultiCache({
      userIds: oThis.contributionUserIds
    }).fetch();

    if (tokenUsersByIdHashRes.isFailure()) {
      return Promise.reject(tokenUsersByIdHashRes);
    }

    oThis.tokenUsersByUserIdMap = tokenUsersByIdHashRes.data;

    return responseHelper.successWithData({});
  }

  /**
   * Fetch images.
   *
   * @sets oThis.imageMap
   *
   * @return {Promise<*>}
   * @private
   */
  async _fetchImages() {
    const oThis = this;

    if (oThis.imageIds.length < 1) {
      return;
    }

    const cacheRsp = await new ImageByIdCache({ ids: oThis.imageIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.imageMap = cacheRsp.data;
  }

  /**
   * Service response.
   *
   * @returns {object}
   * @private
   */
  finalResponse() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis.contributionUserIds.length === oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        page: oThis.page + 1
      };
    }

    const responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };

    const userHash = {},
      tokenUserHash = {};

    for (let index = 0; index < oThis.contributionUserIds.length; index++) {
      const userId = oThis.contributionUserIds[index],
        user = oThis.usersByIdMap[userId],
        tokenUser = oThis.tokenUsersByUserIdMap[userId];
      userHash[userId] = new UserModel().safeFormattedData(user);
      tokenUserHash[userId] = new TokenUserModel().safeFormattedData(tokenUser);
    }

    return {
      usersByIdMap: userHash,
      tokenUsersByUserIdMap: tokenUserHash,
      userIds: oThis.contributionUserIds,
      imageMap: oThis.imageMap,
      meta: responseMetaData,
      profileUserId: oThis.profileUserId,
      contributionUsersByUserIdsMap: oThis.contributionUsersByUserIdsMap
    };
  }

  /**
   * Returns default page limit.
   *
   * @returns {number}
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultUserContributionPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minUserContributionPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxUserContributionPageSize;
  }

  /**
   * Returns current page limit.
   *
   * @returns {number}
   * @private
   */
  _currentPageLimit() {
    const oThis = this;

    return oThis.limit;
  }
}

module.exports = UserContributionBase;
