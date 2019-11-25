const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetUserVideos = require(rootPrefix + '/lib/GetUsersVideoList'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail');

/**
 * Class to get video by id.
 *
 * @class GetVideoById
 */
class GetVideoById extends ServiceBase {
  /**
   * Constructor to get video by id.
   *
   * @param {object} params
   * @param {number} params.video_id
   * @param {object} params.current_user
   * @param {object} params.is_admin
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoId = params.video_id;
    oThis.currentUser = params.current_user;
    oThis.isAdmin = params.is_admin || false;

    oThis.videoDetails = null;
    oThis.currentUserId = null;
    oThis.creatorUserId = null;
    oThis.responseMetaData = {};
    oThis.tokenDetails = {};
    oThis.usersVideosMap = {};
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
   * Fetch creator user id.
   *
   * @sets oThis.videoDetails, oThis.creatorUserId, oThis.currentUserId
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchCreatorUserId() {
    const oThis = this;

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    oThis.videoDetails = [videoDetailsCacheResponse.data[oThis.videoId]];

    // If video not found or its not active.
    if (!CommonValidators.validateNonEmptyObject(oThis.videoDetails[0])) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_v_gbi_1',
          api_error_identifier: 'resource_not_found',
          params_error_identifiers: ['invalid_video_id'],
          debug_options: { videoId: oThis.videoId }
        })
      );
    }

    if (oThis.videoDetails[0].status === videoDetailsConstants.deletedStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_v_gbi_4',
          api_error_identifier: 'resource_not_found',
          params_error_identifiers: ['video_deleted'],
          debug_options: { videoId: oThis.videoId }
        })
      );
    }

    oThis.creatorUserId = oThis.videoDetails[0].creatorUserId;

    oThis.currentUserId = oThis.currentUser ? Number(oThis.currentUser.id) : 0;
  }

  /**
   * Fetch token details.
   *
   * @sets oThis.tokenDetails
   *
   * @return {Promise<void>}
   * @private
   */
  async _setTokenDetails() {
    const oThis = this;

    const tokenResp = await new GetTokenService({}).perform();
    if (tokenResp.isFailure()) {
      return Promise.reject(tokenResp);
    }

    oThis.tokenDetails = tokenResp.data.tokenDetails;
  }

  /**
   * Get video details for display - fetches all the details of user, video.
   *
   * @sets oThis.usersVideosMap, oThis.responseMetaData, oThis.videoDetails
   *
   * @return {Promise<void>}
   * @private
   */
  async _getVideoDetailsForDisplay() {
    const oThis = this;

    const userVideosObj = new GetUserVideos({
      currentUserId: oThis.currentUserId,
      videoIds: [oThis.videoId]
    });

    const response = await userVideosObj.perform();

    if (response.isFailure() || !CommonValidators.validateNonEmptyObject(response.data.userProfilesMap)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_v_gbi_2',
          api_error_identifier: 'entity_not_found',
          debug_options: {}
        })
      );
    }

    oThis.usersVideosMap = response.data;

    const userResponse = oThis.usersVideosMap.usersByIdMap[oThis.creatorUserId];

    if (
      !CommonValidators.validateNonEmptyObject(userResponse) ||
      !userResponse.approvedCreator ||
      userResponse.status === userConstants.inActiveStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_v_gbi_3',
          api_error_identifier: 'entity_not_found',
          debug_options: {}
        })
      );
    }

    // If video is not received back from user profile call.
    if (!oThis.usersVideosMap.videoMap[oThis.videoId]) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_v_gbi_5',
          api_error_identifier: 'entity_not_found',
          debug_options: {}
        })
      );
    }

    // Aligning the response with video-history api.
    oThis.responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: {}
    };

    oThis.videoDetails = [oThis.usersVideosMap.fullVideosMap[oThis.videoId]];

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
      usersByIdMap: oThis.usersVideosMap.usersByIdMap,
      userStat: oThis.usersVideosMap.userStat,
      [entityType.userProfilesMap]: oThis.usersVideosMap.userProfilesMap,
      tags: oThis.usersVideosMap.tags,
      linkMap: oThis.usersVideosMap.linkMap,
      imageMap: oThis.usersVideosMap.imageMap,
      videoMap: oThis.usersVideosMap.videoMap,
      [entityType.videoDetailsMap]: oThis.usersVideosMap.videoDetailsMap,
      [entityType.videoDescriptionsMap]: oThis.usersVideosMap.videoDescriptionMap,
      [entityType.currentUserUserContributionsMap]: oThis.usersVideosMap.currentUserUserContributionsMap,
      [entityType.currentUserVideoContributionsMap]: oThis.usersVideosMap.currentUserVideoContributionsMap,
      [entityType.userProfileAllowedActions]: oThis.usersVideosMap.userProfileAllowedActions,
      tokenUsersByUserIdMap: oThis.usersVideosMap.tokenUsersByUserIdMap,
      [entityType.pricePointsMap]: oThis.usersVideosMap.pricePointsMap,
      tokenDetails: oThis.tokenDetails,
      meta: oThis.responseMetaData
    });
  }
}

module.exports = GetVideoById;
