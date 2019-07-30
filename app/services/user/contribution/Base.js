const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  TokenUserByUserIdsMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  pagination = require(rootPrefix + '/lib/globalConstant/pagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for User Contribution Base
 *
 * @class
 */
class UserContributionBase extends ServiceBase {
  /**
   * Constructor for user contribution base
   *
   * @param params
   *
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.currentUserId = params.current_user.id;
    oThis.paginationIdentifier = params[pagination.paginationIdentifierKey] || null;

    oThis.limit = null;
    oThis.page = null;

    oThis.imageIds = [];
    oThis.imageMap = {};
    oThis.contributionUserIds = [];
    oThis.usersByIdMap = {};
    oThis.tokenUsersByUserIdMap = {};
  }

  /**
   * Async Perform
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchPaginatedUserIdsFromCache();

    await oThis._fetchUsers();

    await oThis._fetchTokenUsers();

    await oThis._fetchImages();

    return responseHelper.successWithData(oThis.finalResponse());
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
    } else {
      oThis.page = 1;
    }
    oThis.limit = pagination.defaultUserContributionPageSize;

    return await oThis._validatePageSize();
  }

  /**
   * Fetch users from cache
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    if (oThis.contributionUserIds.length < 1) {
      return;
    }

    let usersByIdHashRes = await new UserMultiCache({ ids: oThis.contributionUserIds }).fetch();

    if (usersByIdHashRes.isFailure()) {
      return Promise.reject(usersByIdHashRes);
    }

    oThis.usersByIdMap = usersByIdHashRes.data;

    for (let id in oThis.usersByIdMap) {
      const userObj = oThis.usersByIdMap[id];
      if (userObj.profileImageId) {
        oThis.imageIds.push(userObj.profileImageId);
      }
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch token user details from cache
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTokenUsers() {
    const oThis = this;

    if (oThis.contributionUserIds.length < 1) {
      return;
    }

    let tokenUsersByIdHashRes = await new TokenUserByUserIdsMultiCache({ userIds: oThis.contributionUserIds }).fetch();

    if (tokenUsersByIdHashRes.isFailure()) {
      return Promise.reject(tokenUsersByIdHashRes);
    }

    oThis.tokenUsersByUserIdMap = tokenUsersByIdHashRes.data;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch image.
   *
   * @return {Promise<never>}
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
   * Service Response
   *
   * @returns {Promise<void>}
   * @private
   */
  finalResponse() {
    const oThis = this;

    let nextPagePayloadKey = {};

    if (oThis.contributionUserIds.length == oThis.limit) {
      nextPagePayloadKey[pagination.paginationIdentifierKey] = {
        page: oThis.page + 1
      };
    }

    let responseMetaData = {
      [pagination.nextPagePayloadKey]: nextPagePayloadKey
    };

    let userHash = {},
      tokenUserHash = {};

    for (let i = 0; i < oThis.contributionUserIds.length; i++) {
      const userId = oThis.contributionUserIds[i],
        user = oThis.usersByIdMap[userId],
        tokenUser = oThis.tokenUsersByUserIdMap[userId];
      userHash[userId] = new UserModel().safeFormattedData(user);
      tokenUserHash[userId] = new TokenUserModel().safeFormattedData(tokenUser);
    }

    let finalResponse = {
      usersByIdMap: userHash,
      tokenUsersByUserIdMap: tokenUserHash,
      userIds: oThis.contributionUserIds,
      imageMap: oThis.imageMap,
      meta: responseMetaData
    };

    return finalResponse;
  }

  /**
   * _defaultPageLimit
   *
   * @private
   */
  _defaultPageLimit() {
    return pagination.defaultUserContributionPageSize;
  }

  /**
   * _minPageLimit
   *
   * @private
   */
  _minPageLimit() {
    return pagination.minUserContributionPageSize;
  }

  /**
   * _maxPageLimit
   *
   * @private
   */
  _maxPageLimit() {
    return pagination.maxUserContributionPageSize;
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

  /**
   * Fetch user ids from cache
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPaginatedUserIdsFromCache() {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = UserContributionBase;
