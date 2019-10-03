const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetProfile = require(rootPrefix + '/lib/user/profile/Get'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
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

    oThis.videoDetails = null;
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

    const getTokenServiceObj = new GetTokenService({});

    const tokenResp = await getTokenServiceObj.perform();

    if (tokenResp.isFailure()) {
      return Promise.reject(tokenResp);
    }

    oThis.tokenDetails = tokenResp.data.tokenDetails;
  }

  /**
   * Get video details for display - fetches all the details of user, video.
   *
   * @sets oThis.profileResponse, oThis.responseMetaData
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

    if (response.isFailure() || !CommonValidators.validateNonEmptyObject(response.data.userProfilesMap)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_v_gbi_2',
          api_error_identifier: 'entity_not_found',
          debug_options: {}
        })
      );
    }

    oThis.profileResponse = response.data;

    let userResponse = oThis.profileResponse.usersByIdMap[oThis.creatorUserId];

    logger.log('===== userResponse ======', userResponse);

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

    // If video is not received back from user profile call
    if (!oThis.profileResponse.videoMap[oThis.videoId]) {
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
      [entityType.videoDescriptionsMap]: oThis.profileResponse.videoDescriptionMap,
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
