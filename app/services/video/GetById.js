const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  GetProfile = require(rootPrefix + '/lib/user/profile/Get'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType');

class GetVideoById extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoId = params.video_id;
    oThis.currentUser = params.current_user;

    oThis.currentUserId = null;
    oThis.creatorUserId = null;
    oThis.responseMetaData = {};
    oThis.tokenDetails = {};
    oThis.profileResponse = {};
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchCreatorUserId();

    await oThis._setTokenDetails();

    await oThis._getVideoDetailsForDisplay();

    return oThis._prepareResponse();
  }

  /**
   * Fetch creator user id
   *
   * @sets oThis.creatorUserId
   * @return {Promise<void>}
   * @private
   */
  async _fetchCreatorUserId() {
    const oThis = this;

    let videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();

    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    oThis.videoDetails = [videoDetailsCacheResponse.data[oThis.videoId]];

    oThis.creatorUserId = oThis.videoDetails[0].creatorUserId;

    oThis.currentUserId = oThis.currentUser ? Number(oThis.currentUser.id) : 0;
  }

  /**
   * Fetch token details.
   *
   * @sets oThis.tokenDetails
   *
   * @return {Promise<*>}
   * @private
   */
  async _setTokenDetails() {
    const oThis = this;

    const getTokenServiceObj = new GetTokenService({});

    const tokenResp = await getTokenServiceObj.perform();

    if (tokenResp.isFailure()) {
      return Promise.reject(tokenResp);
    }

    oThis.tokenDetails = tokenResp.data.tokenDetails;

    return responseHelper.successWithData({});
  }

  /**
   * Get video details for display - fetches all the details of user, video
   *
   * @return {Promise<void>}
   * @private
   */
  async _getVideoDetailsForDisplay() {
    const oThis = this;

    const getProfileObj = new GetProfile({
      userIds: [oThis.creatorUserId],
      currentUserId: oThis.currentUserId,
      videoIds: [oThis.videoId]
    });

    const response = await getProfileObj.perform();

    if (response.isFailure()) {
      return Promise.reject(response);
    }

    oThis.profileResponse = response.data;

    // Aligning the response with video-history api
    oThis.responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: {}
    };

    return responseHelper.successWithData({});
  }

  /**
   * Prepare final response.
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

module.exports = GetVideoById;
