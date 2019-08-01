const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetProfile = require(rootPrefix + '/lib/user/profile/Get'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

class UserVideos extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.profileUserId = +params.profile_user_id;
    oThis.currentUser = params.current_user;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.currentUserId = null;
    oThis.limit = oThis._defaultPageLimit();
    oThis.paginationTimestamp = null;
    oThis.nextPaginationTimestamp = null;
    oThis.videoIds = [];
    oThis.videoDetails = [];
    oThis.tokenDetails = {};
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchVideoIds();

    await oThis._addResponseMetaData();

    await oThis._setTokenDetails();

    await oThis._getVideos();

    return oThis._prepareResponse();
  }

  /**
   * Validate and Sanitize
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.currentUser) {
      oThis.currentUserId = Number(oThis.currentUser.id);
    } else {
      oThis.currentUserId = 0;
    }

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);

      oThis.paginationTimestamp = parsedPaginationParams.pagination_timestamp; // Override paginationTimestamp number.
    } else {
      oThis.paginationTimestamp = null;
    }

    // Validate limit.
    return oThis._validatePageSize();
  }

  /**
   * Fetch video ids
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchVideoIds() {
    const oThis = this;

    let videoDetailObj = new VideoDetailsModel({});

    let videoDetails = await videoDetailObj.fetchByCreatorUserId({
      creatorUserId: oThis.profileUserId,
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp
    });

    for (let videoId in videoDetails) {
      let videoDetail = videoDetails[videoId];
      oThis.videoIds.push(videoDetail.videoId);
      oThis.videoDetails.push(videoDetail);
      if (!oThis.nextPaginationTimestamp) {
        oThis.nextPaginationTimestamp = videoDetail.createdAt;
      }
    }
  }

  /**
   * Add next page meta data
   *
   * @return {Promise<void>}
   * @private
   */
  async _addResponseMetaData() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis.videoIds.length >= oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        pagination_timestamp: oThis.nextPaginationTimestamp
      };
    }

    oThis.responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };
  }

  /**
   * Fetch token details.
   *
   * @return {Promise<void>}
   * @private
   */
  async _setTokenDetails() {
    const oThis = this;

    let getTokenServiceObj = new GetTokenService({});

    let tokenResp = await getTokenServiceObj.perform();

    if (tokenResp.isFailure()) {
      return Promise.reject(tokenResp);
    }
    oThis.tokenDetails = tokenResp.data.tokenDetails;
  }

  /**
   * Get videos
   *
   * @return {Promise<never>}
   * @private
   */
  async _getVideos() {
    const oThis = this;

    let getProfileObj = new GetProfile({ userIds: [oThis.profileUserId], currentUserId: oThis.currentUserId });

    let response = await getProfileObj.perform();

    if (response.isFailure()) {
      return Promise.reject(response);
    }

    oThis.profileResponse = response.data;
  }

  /**
   * Default Page Limit.
   *
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultTagListPageSize;
  }

  /**
   * Min page limit.
   *
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minTagListPageSize;
  }

  /**
   * Max page limit.
   *
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxTagListPageSize;
  }

  /**
   * Current page limit.
   *
   * @private
   */
  _currentPageLimit() {
    const oThis = this;

    return oThis.limit;
  }

  /**
   * Prepare final response
   *
   * @return {Promise<*|result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      [entityType.userVideoList]: oThis.videoDetails,
      usersByIdMap: oThis.profileResponse.usersByIdMap,
      userStat: oThis.profileResponse.userStat,
      [entityType.userProfilesMap]: oThis.profileResponse.userProfilesMap,
      tags: oThis.profileResponse.tags,
      linkMap: oThis.profileResponse.linkMap,
      imageMap: oThis.profileResponse.imageMap,
      videoMap: oThis.profileResponse.videoMap,
      [entityType.videoDetailsMap]: oThis.profileResponse.videoDetailsMap,
      [entityType.currentUserUserContributionsMap]: oThis.profileResponse.currentUserUserContributionsMap,
      [entityType.currentUserVideoContributionsMap]: oThis.profileResponse.currentUserVideoContributionsMap,
      [entityType.userProfileAllowedActions]: oThis.profileResponse.userProfileAllowedActions,
      tokenUsersByUserIdMap: oThis.profileResponse.tokenUsersByUserIdMap,
      [entityType.pricePointsMap]: oThis.profileResponse.pricePointsMap,
      tokenDetails: oThis.tokenDetails,
      meta: oThis.responseMetaData
    });
  }
}

module.exports = UserVideos;
