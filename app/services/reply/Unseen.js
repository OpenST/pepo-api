const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FetchAssociatedEntities = require(rootPrefix + '/lib/FetchAssociatedEntities'),
  UserVideoViewModel = require(rootPrefix + '/app/models/cassandra/UserVideoView'),
  VideoDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  AllRepliesByParentVideoId = require(rootPrefix + '/lib/cacheManagement/single/AllRepliesByParentVideoId'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail');

/**
 * Class for unseen replies for a parent video id.
 *
 * @class Unseen
 */
class Unseen extends ServiceBase {
  /**
   * Constructor for unseen reply videos.
   *
   * @param {object} params
   * @param {string/number} params.video_id
   * @param {object} [params.current_user]
   * @param {boolean} [params.is_admin]
   * @param {string} [params.pagination_identifier]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoId = +params.video_id;
    oThis.currentUser = params.current_user || null;

    oThis.allRepliesArray = [];
    oThis.seenVideos = {};
    oThis.unseenRepliesArray = [];
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateVideoId();

    await oThis._fetchAllRepliesOfGivenParentVideoId();

    await oThis._fetchAllSeenVideoOfCurrentUserId();

    oThis._filterVideosToDisplay();

    await oThis._fetchUserAndRelatedEntities();

    return oThis._prepareResponse();
  }

  /**
   * Validate video id
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateVideoId() {
    const oThis = this;

    let videoDetailsRsp = await new VideoDetailsByVideoIds({ videoIds: [oThis.videoId] }).fetch();
    if (videoDetailsRsp.isFailure()) {
      return Promise.reject(videoDetailsRsp);
    }

    let videoStatus = videoDetailsRsp.data[oThis.videoId].status;
    if (videoStatus && videoStatus !== videoDetailsConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_r_p_us_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_video_id'],
          debug_options: { videoId: oThis.videoId, videoDetails: videoDetailsRsp.data[oThis.videoId] }
        })
      );
    }
  }

  /**
   * Fetch All Replies Of Given Parent VideoId
   *
   * @sets oThis.allRepliesArray
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAllRepliesOfGivenParentVideoId() {
    const oThis = this;

    let allRepliesCacheRsp = await new AllRepliesByParentVideoId({ parentVideoId: oThis.videoId }).fetch();

    if (allRepliesCacheRsp.isFailure()) {
      return Promise.reject(allRepliesCacheRsp);
    }

    oThis.allRepliesArray = allRepliesCacheRsp.data.allReplies;
  }

  /**
   * Fetch all seen video of current user id.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAllSeenVideoOfCurrentUserId() {
    const oThis = this;
    if (!oThis.currentUser || oThis.allRepliesArray.length === 0) {
      return;
    }

    let replyVideoIds = [];

    for (let i = 0; i < oThis.allRepliesArray.length; i++) {
      replyVideoIds.push(oThis.allRepliesArray[i][replyDetailConstants.longToShortNamesMapForCache['replyVideoId']]);
    }

    let seenVideosData = await new UserVideoViewModel().fetchVideoViewDetails({
      userId: oThis.currentUser.id,
      videoIds: replyVideoIds
    });

    for (let videoId in seenVideosData) {
      if (seenVideosData[videoId].lastViewAt) {
        oThis.seenVideos[videoId] = seenVideosData[videoId];
      }
    }
  }

  /**
   * Filter seen videos.
   *
   * @private
   */
  _filterVideosToDisplay() {
    const oThis = this;

    //loop through the all replies array. And remove all the videos which are seen. Break the loop once 4 unseen replies are fetched.
    for (let i = oThis.allRepliesArray.length - 1; i >= 0; i--) {
      if (
        !oThis.seenVideos[oThis.allRepliesArray[i][replyDetailConstants.longToShortNamesMapForCache['replyVideoId']]]
      ) {
        oThis.unseenRepliesArray.push(oThis.allRepliesArray[i]);
        if (oThis.unseenRepliesArray.length === 4) {
          break;
        }
      }
    }
  }

  /**
   * Fetch user and related entities.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserAndRelatedEntities() {
    const oThis = this;

    let userIdsArray = [];
    for (let i = 0; i < oThis.unseenRepliesArray.length; i++) {
      userIdsArray.push(oThis.unseenRepliesArray[i][replyDetailConstants.longToShortNamesMapForCache['creatorUserId']]);
    }

    let associatedEntitiesRsp = await new FetchAssociatedEntities({ userIds: userIdsArray }).perform();

    if (associatedEntitiesRsp.isFailure()) {
      return Promise.reject(associatedEntitiesRsp);
    }
    oThis.userEntities = associatedEntitiesRsp.data;
  }

  /**
   * Prepare final response.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    let unseenRepliesEntity = {};
    unseenRepliesEntity[oThis.videoId] = {
      unseen: oThis.unseenRepliesArray
    };

    return responseHelper.successWithData({
      [entityTypeConstants.unseenReplies]: unseenRepliesEntity,
      usersByIdMap: oThis.userEntities.usersMap,
      imageMap: oThis.userEntities.imagesMap,
      tokenUsersByUserIdMap: oThis.userEntities.tokenUsersByUserIdMap
    });
  }
}

module.exports = Unseen;
