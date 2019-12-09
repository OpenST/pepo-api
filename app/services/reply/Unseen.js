const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  GetUserVideosList = require(rootPrefix + '/lib/GetUsersVideoList'),
  FetchAssociatedEntities = require(rootPrefix + '/lib/FetchAssociatedEntities'),
  UserVideoViewModel = require(rootPrefix + '/app/models/cassandra/UserVideoView'),
  AllRepliesByParentVideoId = require(rootPrefix + '/lib/cacheManagement/single/AllRepliesByParentVideoId'),
  ReplyDetailsByParentVideoPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/ReplyDetailsByParentVideoPagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

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
    oThis.currentUser = params.current_user;

    oThis.currentUserId = oThis.currentUser.id;

    oThis.allRepliesArray = [];
    oThis.seenVideos = {};
    oThis.unseenRepliesArray = [];

    oThis.videoReplies = [];
    oThis.replyDetailIds = [];
    oThis.userRepliesMap = {};
    oThis.tokenDetails = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchAllRepliesOfGivenParentVideoId();

    await oThis._fetchAllSeenVideoOfCurrentUserId();

    oThis._filterUnSeenVideos();

    await oThis._fetchUserAndRelatedEntities();

    return oThis._prepareResponse();
  }

  /**
   * Validate and sanitize.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;
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

    let replyVideoIds = [];

    for (let i = 0; i < oThis.allRepliesArray.length; i++) {
      replyVideoIds.push(oThis.allRepliesArray[i].replyVideoId);
    }

    let seenVideosData = await new UserVideoViewModel().fetchVideoViewDetails({
      userId: oThis.currentUserId,
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
  _filterUnSeenVideos() {
    const oThis = this;

    //loop through the all replies array. And remove all the videos which are seen.
    for (let i = 0; i < oThis.allRepliesArray.length; i++) {
      if (!oThis.seenVideos[oThis.allRepliesArray[i].replyVideoId]) {
        oThis.unseenRepliesArray.push(oThis.allRepliesArray[i]);
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
      userIdsArray.push(oThis.unseenRepliesArray[i].creatorId);
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
