const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  TagByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  UrlsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds'),
  VideoByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  ImageByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  TextsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  UserBlockedListCache = require(rootPrefix + '/lib/cacheManagement/single/UserBlockedList'),
  TokenUserByUserIdsMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  TextIncludesByTextIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  ReplyDetailsByVideoIdCache = require(rootPrefix + '/lib/cacheManagement/single/ReplyDetailsByVideoIdPagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for video reply details service.
 *
 * @class GetReplyList
 */
class GetReplyList extends ServiceBase {
  /**
   * Constructor for video reply details service.
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
    oThis.isAdmin = params.is_admin || false;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.limit = oThis._defaultPageLimit();

    oThis.currentUserId = null;
    oThis.paginationTimestamp = null;

    oThis.videoCreatorId = null;

    oThis.blockedUserInfoForCurrentUser = {};

    oThis.nextPaginationTimestamp = null;
    oThis.repliesCount = 0;
    oThis.replyDetails = {};
    oThis.videoReplies = [];
    oThis.videoIds = [];
    oThis.userIds = [];
    oThis.linkIds = [];
    oThis.descriptionIds = [];

    oThis.videos = {};
    oThis.imageIds = [];

    oThis.users = {};

    oThis.videoDescriptions = {};

    oThis.links = {};

    oThis.tags = {};

    oThis.images = {};

    oThis.tokenUsersByUserIdMap = {};
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

    let promisesArray = [oThis._fetchVideoDetails(), oThis._fetchUserBlockedList()];
    await Promise.all(promisesArray);

    const blockedCheckResponseForCurrentUser = oThis._performBlockedUserChecks(oThis.videoCreatorId);
    if (blockedCheckResponseForCurrentUser.isFailure()) {
      return oThis._prepareResponse();
    }

    await oThis._fetchVideoReplies();

    if (oThis.repliesCount === 0) {
      return oThis._prepareResponse();
    }

    promisesArray = [
      oThis._fetchVideos(),
      oThis._fetchUsers(),
      oThis._fetchVideoDescriptions(),
      oThis._fetchLinks(),
      oThis._fetchTags()
    ];
    await Promise.all(promisesArray);

    promisesArray = [oThis._fetchImages(), oThis._fetchTokenUsers()];
    await Promise.all(promisesArray);

    oThis._addResponseMetaData();

    return oThis._prepareResponse();
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.currentUserId, oThis.paginationTimestamp
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    oThis.currentUserId = oThis.currentUser ? Number(oThis.currentUser.id) : 0;

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
   * Fetch video details.
   *
   * @sets oThis.videoCreatorId
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchVideoDetails() {
    const oThis = this;

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_l_fvd_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { videoId: oThis.videoId }
        })
      );
    }

    const videoDetails = videoDetailsCacheResponse.data[oThis.videoId];
    if (!CommonValidators.validateNonEmptyObject(videoDetails)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_r_l_fvd_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_video_id'],
          debug_options: { videoId: oThis.videoId }
        })
      );
    }

    oThis.videoCreatorId = videoDetails.creatorUserId;
  }

  /**
   * Fetch current user blocked details.
   *
   * @sets oThis.blockedUserInfoForCurrentUser
   *
   * @returns {Promise<result>}
   * @private
   */
  async _fetchUserBlockedList() {
    const oThis = this;

    // Check for blocked user's list.
    const blockedUserCacheResponse = await new UserBlockedListCache({ userId: oThis.currentUserId }).fetch();
    if (blockedUserCacheResponse.isFailure()) {
      return Promise.reject(blockedUserCacheResponse);
    }

    oThis.blockedUserInfoForCurrentUser = blockedUserCacheResponse.data[oThis.currentUserId];
  }

  /**
   * Perform blocked user check with respect to current user.
   *
   * @param {number} compareWithUserId: UserId which needs to be compared with the currentUserId.
   *
   * @returns {result}
   * @private
   */
  _performBlockedUserChecks(compareWithUserId) {
    const oThis = this;

    if (
      oThis.blockedUserInfoForCurrentUser.hasBlocked[compareWithUserId] ||
      oThis.blockedUserInfoForCurrentUser.blockedBy[compareWithUserId]
    ) {
      return responseHelper.error();
    }

    return responseHelper.success();
  }

  /**
   * Fetch video reply details.
   *
   * @sets oThis.replyDetails, oThis.repliesCount, oThis.videoIds, oThis.userIds, oThis.descriptionIds, oThis.linkIds,
   *       oThis.nextPaginationTimestamp
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchVideoReplies() {
    const oThis = this;

    const cacheResponse = await new ReplyDetailsByVideoIdCache({
      videoId: oThis.videoId,
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.replyDetails = cacheResponse.data.replyDetails;
    const replyIds = cacheResponse.data.replyIds || [];

    for (let index = 0; index < replyIds.length; index++) {
      const replyId = replyIds[index];
      const replyDetail = oThis.replyDetails[replyId];

      const replyVideoCreatorId = replyDetail.creatorUserId;
      const blockedCheckResponseForCurrentUser = oThis._performBlockedUserChecks(replyVideoCreatorId);
      if (blockedCheckResponseForCurrentUser.isFailure()) {
        delete oThis.replyDetails[replyId];
        continue;
      }

      oThis.repliesCount++;

      const videoReplyEntity = {
        id: replyId,
        userId: replyDetail.creatorUserId,
        replyDetailId: replyId,
        updatedAt: replyDetail.updatedAt
      };

      oThis.videoReplies.push(videoReplyEntity);

      oThis.videoIds.push(replyDetail.entityId);
      oThis.userIds.push(replyDetail.creatorUserId);

      if (replyDetail.descriptionId) {
        oThis.descriptionIds.push(replyDetail.descriptionId);
      }
      if (replyDetail.linkIds) {
        oThis.linkIds = oThis.linkIds.concat(replyDetail.linkIds);
      }

      oThis.nextPaginationTimestamp = replyDetail.createdAt;
    }

    oThis.userIds = [...new Set(oThis.userIds)]; // Get unique userIds.
  }

  /**
   * Fetch videos.
   *
   * @sets oThis.videos, oThis.imageIds
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchVideos() {
    const oThis = this;

    if (oThis.videoIds.length === 0) {
      return;
    }

    const videosCacheResponse = await new VideoByIdsCache({ ids: oThis.videoIds }).fetch();
    if (videosCacheResponse.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_l_fv_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { videoIds: oThis.videoIds }
        })
      );
    }

    oThis.videos = videosCacheResponse.data;

    for (const videoId in oThis.videos) {
      const videoEntity = oThis.videos[videoId];
      if (videoEntity.posterImageId) {
        oThis.imageIds.push(videoEntity.posterImageId);
      }
    }
  }

  /**
   * Fetch users.
   *
   * @sets oThis.users
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return;
    }

    const usersCacheResponse = await new UserCache({ ids: oThis.userIds }).fetch();
    if (usersCacheResponse.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_l_fu_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { userIds: oThis.userIds }
        })
      );
    }

    oThis.users = usersCacheResponse.data;
  }

  /**
   * Fetch video descriptions.
   *
   * @sets oThis.videoDescriptions
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchVideoDescriptions() {
    const oThis = this;

    if (oThis.descriptionIds.length === 0) {
      return;
    }

    const descriptionsCacheResponse = await new TextIncludesByTextIdsCache({ ids: oThis.descriptionIds }).fetch();
    if (descriptionsCacheResponse.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_l_fvd_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { descriptionIds: oThis.descriptionIds }
        })
      );
    }

    oThis.videoDescriptions = descriptionsCacheResponse.data;
  }

  /**
   * Fetch links.
   *
   * @sets oThis.links
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchLinks() {
    const oThis = this;

    if (oThis.linkIds.length === 0) {
      return;
    }

    const urlsCacheResponse = await new UrlsByIdsCache({ ids: oThis.linkIds }).fetch();
    if (urlsCacheResponse.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_l_fl_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { linkIds: oThis.linkIds }
        })
      );
    }

    oThis.links = urlsCacheResponse.data;
  }

  /**
   * Fetch tags.
   *
   * @sets oThis.tags
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchTags() {
    const oThis = this;

    const textsCacheResponse = await new TextsByIdsCache({ ids: oThis.descriptionIds }).fetch();
    if (textsCacheResponse.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_l_ft_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { descriptionIds: oThis.descriptionIds }
        })
      );
    }

    const texts = textsCacheResponse.data;
    let tagIds = [];
    for (const textId in texts) {
      const textEntity = texts[textId];
      if (textEntity.tagIds) {
        tagIds = tagIds.concat(textEntity.tagIds);
      }
    }

    if (tagIds.length === 0) {
      return;
    }

    const tagsCacheResponse = await new TagByIdsCache({ ids: tagIds }).fetch();
    if (tagsCacheResponse.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_l_ft_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { tagIds: oThis.tagIds }
        })
      );
    }

    oThis.tags = tagsCacheResponse.data;
  }

  /**
   * Fetch images.
   *
   * @sets oThis.images
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchImages() {
    const oThis = this;

    if (oThis.imageIds.length === 0) {
      return;
    }

    const imagesCacheResponse = await new ImageByIdsCache({ ids: oThis.imageIds }).fetch();
    if (imagesCacheResponse.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_l_fi_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { imageIds: oThis.imageIds }
        })
      );
    }

    oThis.images = imagesCacheResponse.data;
  }

  /**
   * Fetch token user details.
   *
   * @sets oThis.tokenUsersByUserIdMap
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchTokenUsers() {
    const oThis = this;

    if (oThis.userIds.length === 1) {
      return;
    }

    const tokenUsersByIdHashResponse = await new TokenUserByUserIdsMultiCache({
      userIds: oThis.userIds
    }).fetch();

    if (tokenUsersByIdHashResponse.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_l_ftu_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { userIds: oThis.userIds }
        })
      );
    }

    oThis.tokenUsersByUserIdMap = tokenUsersByIdHashResponse.data;
  }

  /**
   * Add next page meta data.
   *
   * @sets oThis.responseMetaData
   *
   * @return {Result}
   * @private
   */
  _addResponseMetaData() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis.repliesCount >= oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        pagination_timestamp: oThis.nextPaginationTimestamp
      };
    }

    oThis.responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };

    return responseHelper.successWithData({});
  }

  /**
   * Prepare final response.
   *
   * @return {Promise<result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      [entityType.videoDetailsMap]: oThis.videoDetails,
      [entityType.linksMap]: oThis.links,
      videoMap: oThis.videos,
      imageMap: oThis.images,
      usersByIdMap: oThis.users,
      tokenUsersByUserIdMap: oThis.tokenUsersByUserIdMap,
      tags: oThis.tags,
      meta: oThis.responseMetaData
    });
  }

  /**
   * Returns default page limit.
   *
   * @returns {number}
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultVideoListPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minVideoListPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxVideoListPageSize;
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

module.exports = GetReplyList;
