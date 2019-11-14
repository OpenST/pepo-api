const rootPrefix = '..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  GetProfileLib = require(rootPrefix + '/lib/user/profile/Get'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  FetchAssociatedEntities = require(rootPrefix + '/lib/FetchAssociatedEntities'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  VideoDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  ReplyDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByEntityIdsAndEntityKind'),
  VideoContributorByVideoIdsAndContributedByUserId = require(rootPrefix +
    '/lib/cacheManagement/multi/VideoContributorByVideoIdsAndContributedByUserId'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail');

/**
 * Class to fetch users videos, which are posted as video posts or replies.
 *
 * @class GetUsersVideoList
 */
class GetUsersVideoList {
  /**
   * Constructor to fetch users videos, which are posted as video posts or replies.
   *
   * @param {object} params
   * @param {array<number>} [params.creatorUserIds]
   * @param {number} params.currentUserId
   * @param {boolean} [params.isAdmin]
   * @param {array<number>} [params.videoIds]
   * @param {array<number>} [params.replyDetailIds]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.creatorUserIds = params.creatorUserIds || [];
    oThis.currentUserId = params.currentUserId;
    oThis.isAdmin = params.isAdmin || false;
    oThis.videoIds = params.videoIds || [];
    oThis.replyDetailIds = params.replyDetailIds || [];

    oThis.videoDetailsMap = {};
    oThis.videoDescriptionMap = {};
    oThis.replyDetailsMap = {};
    oThis.creatorsProfileData = null;
    oThis.allTextIds = [];
    oThis.allLinkIds = [];
    oThis.profileImageIds = [];

    oThis.currentUserVideoContributionsMap = {};
    oThis.links = {};
    oThis.tags = {};
    oThis.images = {};
    oThis.videos = {};
    oThis.fullVideosMap = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<result>}
   */
  async perform() {
    const oThis = this;

    await oThis._validateParams();

    await oThis._fetchVideoDetails();

    await oThis._fetchCreatorsProfile();

    // Filter videos which can be sent outside.
    oThis._filterVideosToSend();

    const promisesArray = [];
    promisesArray.push(oThis._fetchAssociatedEntities(), oThis._fetchVideoContributions());

    await Promise.all(promisesArray);

    const finalResponse = oThis.creatorsProfileData;

    Object.assign(finalResponse, {
      imageMap: oThis.images,
      videoMap: oThis.videos,
      linkMap: oThis.links,
      tags: oThis.tags,
      videoDetailsMap: oThis.videoDetailsMap,
      replyDetailsMap: oThis.replyDetailsMap,
      videoDescriptionMap: oThis.videoDescriptionMap,
      currentUserVideoContributionsMap: oThis.currentUserVideoContributionsMap,
      fullVideosMap: oThis.fullVideosMap
    });

    return responseHelper.successWithData(finalResponse);
  }

  /**
   * Validate params.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateParams() {
    const oThis = this;

    if (CommonValidators.isVarNullOrUndefined(oThis.currentUserId)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_uv_ga_1',
          api_error_identifier: 'invalid_params',
          debug_options: {}
        })
      );
    }

    // Atleast one optional parameter should be present.
    if (oThis.videoIds.length <= 0 && oThis.replyDetailIds.length <= 0) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_uv_ga_2',
          api_error_identifier: 'invalid_params',
          debug_options: {}
        })
      );
    }
  }

  /**
   * Fetch video details
   *
   * @sets oThis.videoDetailsMap
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchVideoDetails() {
    const oThis = this;

    // If reply details are present.
    if (oThis.replyDetailIds.length > 0) {
      await oThis._fetchReplyDetailsById();
    }

    const notInVideoDetails = [];
    if (oThis.videoIds.length > 0) {
      const VideoDetailsByVideoIdsCacheObj = new VideoDetailsByVideoIds({
          videoIds: oThis.videoIds
        }),
        cacheRsp = await VideoDetailsByVideoIdsCacheObj.fetch();

      if (cacheRsp.isFailure()) {
        return Promise.reject(cacheRsp);
      }

      oThis.videoDetailsMap = cacheRsp.data;
      for (const vid in oThis.videoDetailsMap) {
        if (!CommonValidators.validateNonEmptyObject(oThis.videoDetailsMap[vid])) {
          notInVideoDetails.push(vid);
        }
      }
      oThis._filterOutVideoDetails(oThis.videoDetailsMap, 'videoDetail');
      // If videos are present but video details are not present, then look for those videos in reply details.
      if (notInVideoDetails.length > 0) {
        await oThis._fetchReplyDetailsByVideoIds(notInVideoDetails);
      }
    }
  }

  /**
   * Fetch reply details by id.
   *
   * @sets oThis.replyDetailsMap
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchReplyDetailsById() {
    const oThis = this;

    const ReplyDetailsByIdsCacheObj = new ReplyDetailsByIdsCache({
        ids: oThis.replyDetailIds
      }),
      cacheRsp = await ReplyDetailsByIdsCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.replyDetailsMap = cacheRsp.data;
    oThis._filterOutVideoDetails(oThis.replyDetailsMap, 'replyDetail');
  }

  /**
   * Fetch reply details by video ids.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchReplyDetailsByVideoIds(videoIds) {
    const oThis = this;

    const ReplyDetailsByIdsCacheObj = new ReplyDetailsByVideoIds({
        entityIds: videoIds,
        entityKind: replyDetailConstants.videoEntityKind
      }),
      cacheRsp = await ReplyDetailsByIdsCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    for (const vid in cacheRsp.data) {
      const rdObj = cacheRsp.data[vid];
      if (CommonValidators.validateNonEmptyObject(rdObj)) {
        oThis.replyDetailsMap[rdObj.id] = rdObj;
      }
    }
    oThis._filterOutVideoDetails(oThis.replyDetailsMap, 'replyDetail');
  }

  /**
   * Filter out various things from details map.
   *
   * @sets oThis.allTextIds, oThis.allLinkIds
   *
   * @param {object} detailsMap
   * @param {string} kind
   * @private
   */
  _filterOutVideoDetails(detailsMap, kind) {
    const oThis = this;

    const descriptionIds = [];
    let allLinkIds = [];
    for (const key in detailsMap) {
      const vDetail = detailsMap[key];
      oThis.creatorUserIds.push(vDetail.creatorUserId);
      const vdPayload = { creatorUserId: vDetail.creatorUserId, updatedAt: vDetail.updatedAt };

      if (vDetail.descriptionId) {
        descriptionIds.push(vDetail.descriptionId);
      }
      if (vDetail.linkIds) {
        allLinkIds = allLinkIds.concat(vDetail.linkIds);
      }
      if (kind === 'replyDetail') {
        if (vDetail.entityKind === replyDetailConstants.videoEntityKind) {
          oThis.videoIds.push(vDetail.entityId);
          vdPayload.videoId = vDetail.entityId;
        }
        vdPayload.replyDetailId = vDetail.id;
      } else {
        vdPayload.videoId = vDetail.videoId;
        vdPayload.videoDetailId = vDetail.videoId;
      }
      oThis.fullVideosMap[vdPayload.videoId] = vdPayload;
    }

    oThis.allTextIds = oThis.allTextIds.concat(descriptionIds);
    oThis.allLinkIds = oThis.allLinkIds.concat(allLinkIds);
  }

  /**
   * Fetch profile of creators.
   *
   * @sets oThis.creatorsProfileData, oThis.allTextIds, oThis.allLinkIds, oThis.profileImageIds
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchCreatorsProfile() {
    const oThis = this;

    const getProfileObj = new GetProfileLib({
      userIds: oThis.creatorUserIds,
      currentUserId: oThis.currentUserId,
      isAdmin: oThis.isAdmin,
      fetchAssociatedEntities: 0
    });

    const response = await getProfileObj.perform();

    if (response.isFailure()) {
      return Promise.reject(response);
    }

    oThis.creatorsProfileData = response.data;
    oThis.allTextIds = oThis.allTextIds.concat(oThis.creatorsProfileData.textIds);
    oThis.allLinkIds = oThis.allLinkIds.concat(oThis.creatorsProfileData.linkIds);
    oThis.profileImageIds = oThis.creatorsProfileData.imageIdsArray;
  }

  /**
   * Filter videos which can be sent outside.
   *
   * @private
   */
  _filterVideosToSend() {
    const oThis = this;

    for (const videoId in oThis.videoDetailsMap) {
      const videoDetail = oThis.videoDetailsMap[videoId];
      if (oThis.canForwardVideoDetails(videoDetail.creatorUserId)) {
        const userObj = oThis.creatorsProfileData.usersByIdMap[videoDetail.creatorUserId];
        const isApprovedCreator = UserModel.isUserApprovedCreator(userObj);

        videoDetail.isReplyAllowed = isApprovedCreator ? 1 : 0;
      } else {
        const index = oThis.videoIds.indexOf(videoId);
        if (index > -1) {
          oThis.videoIds.splice(index, 1);
        }

        delete oThis.videoDetailsMap[videoId];
      }
    }
  }

  /**
   * Fetch all associated entities.
   *
   * @sets oThis.links, oThis.tags, oThis.images, oThis.videos
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAssociatedEntities() {
    const oThis = this;

    const associatedEntitiesResp = await new FetchAssociatedEntities({
      textIds: oThis.allTextIds,
      linkIds: oThis.allLinkIds,
      videoIds: oThis.videoIds,
      imageIds: oThis.profileImageIds
    }).perform();

    oThis.links = associatedEntitiesResp.data.links;
    oThis.tags = associatedEntitiesResp.data.tags;
    oThis.images = associatedEntitiesResp.data.imagesMap;
    oThis.videos = associatedEntitiesResp.data.videosMap;
    const textMap = associatedEntitiesResp.data.textMap;

    for (const videoId in oThis.videoDetailsMap) {
      const videoDetail = oThis.videoDetailsMap[videoId];
      const textId = videoDetail.descriptionId;
      if (textId && textMap[textId]) {
        oThis.videoDescriptionMap[textId] = textMap[textId];
      }
    }

    for (const userId in oThis.creatorsProfileData.userProfilesMap) {
      const textId = oThis.creatorsProfileData.userProfilesMap[userId].bioId;
      if (textId && textMap[textId]) {
        oThis.creatorsProfileData.userProfilesMap[userId].bio = textMap[textId];
      }
    }
  }

  /**
   * Fetch video contributions.
   *
   * @sets oThis.currentUserVideoContributionsMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideoContributions() {
    const oThis = this;

    if (oThis.videoIds.length <= 0) {
      return responseHelper.successWithData({});
    }

    const videoContributorByVideoIdsAndContributedByUserIdCacheRsp = await new VideoContributorByVideoIdsAndContributedByUserId(
      {
        videoIds: oThis.videoIds,
        contributedByUserId: oThis.currentUserId
      }
    ).fetch();

    if (videoContributorByVideoIdsAndContributedByUserIdCacheRsp.isFailure()) {
      return Promise.reject(videoContributorByVideoIdsAndContributedByUserIdCacheRsp);
    }

    oThis.currentUserVideoContributionsMap = videoContributorByVideoIdsAndContributedByUserIdCacheRsp.data;
  }

  /**
   * Can forward video details.
   *
   * @param {number} creatorUserId
   *
   * @returns {boolean}
   */
  canForwardVideoDetails(creatorUserId) {
    const oThis = this;

    if (oThis.isAdmin || +oThis.currentUserId === +creatorUserId) {
      return true;
    }

    const userObj = oThis.creatorsProfileData.usersByIdMap[creatorUserId];
    if (!CommonValidators.validateNonEmptyObject(userObj) || userObj.status === userConstants.inActiveStatus) {
      return false;
    }

    // Current user has either blocked this user, or blocked by him
    const currentUserBlockedList = oThis.creatorsProfileData.currentUserBlockedList;
    if (currentUserBlockedList.hasBlocked[userObj.id] || currentUserBlockedList.blockedBy[userObj.id]) {
      return false;
    }

    return UserModel.isUserApprovedCreator(userObj);
  }
}

module.exports = GetUsersVideoList;
