/**
 * This module helps in fetching users videos, which are posted as video posts or replies.
 * @module lib/userVideos/GetAll.js
 */

const rootPrefix = '..',
  GetProfileLib = require(rootPrefix + '/lib/user/profile/NewGet'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  FetchAssociatedEntities = require(rootPrefix + '/lib/FetchAssociatedEntities'),
  VideoContributorByVideoIdsAndContributedByUserId = require(rootPrefix +
    '/lib/cacheManagement/multi/VideoContributorByVideoIdsAndContributedByUserId'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GetAllUserVideos {
  constructor(params) {
    const oThis = this;

    oThis.creatorUserIds = params.creatorUserIds || [];
    oThis.currentUserId = params.currentUserId;
    oThis.isAdmin = params.isAdmin || false;
    oThis.videoIds = params.videoIds || [];
    oThis.replyDetailIds = params.replyDetailIds || [];

    oThis.videoDetailsMap = {};
    oThis.videoDescriptionMap = {};
    oThis.replyDetailsMap = null;
    oThis.creatorsProfileData = null;
    oThis.allTextIds = [];
    oThis.allLinkIds = [];

    oThis.currentUserVideoContributionsMap = {};
    oThis.links = {};
    oThis.tags = {};
    oThis.images = {};
    oThis.videos = {};
  }

  /**
   * Main performer of class
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._validateParams();

    // If creator users are not present, then fetch
    if (oThis.creatorUserIds.length <= 0) {
      await oThis._fetchVideoCreators();
    }

    await oThis._fetchCreatorsProfile();

    // Filter videos which can be sent outside
    oThis._filterVideosToSend();

    let promisesArray = [];
    promisesArray.push(oThis._fetchAssociatedEntities(), oThis._fetchVideoContributions());

    await Promise.all(promisesArray);

    let finalResponse = oThis.creatorsProfileData;

    Object.assign(finalResponse, {
      imageMap: oThis.images,
      videoMap: oThis.videos,
      linkMap: oThis.links,
      tags: oThis.tags,
      videoDetailsMap: oThis.videoDetailsMap,
      videoDescriptionMap: oThis.videoDescriptionMap,
      currentUserVideoContributionsMap: oThis.currentUserVideoContributionsMap
    });

    return responseHelper.successWithData(finalResponse);
  }

  /**
   * Validate params
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateParams() {
    const oThis = this;

    if (!oThis.currentUserId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_uv_ga_1',
          api_error_identifier: 'invalid_params',
          debug_options: {}
        })
      );
    }

    // Atleast one optional parameter should be present.
    if (oThis.creatorUserIds.length <= 0 && oThis.videoIds.length <= 0 && oThis.replyDetailIds.length <= 0) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_uv_ga_2',
          api_error_identifier: 'invalid_params',
          debug_options: {}
        })
      );
    }
  }

  async _fetchVideoCreators() {
    const oThis = this;

    // If video ids are present then fetch creator of videos
    if (oThis.videoIds.length > 0) {
      await oThis._fetchVideoDetails();
    }
  }

  /**
   * Fetch video details
   *
   * @sets oThis.videoDetailsMap, oThis.descriptionIds, oThis.allTextIds
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchVideoDetails() {
    const oThis = this;

    const VideoDetailsByVideoIdsCacheObj = new VideoDetailsByVideoIds({
        videoIds: oThis.videoIds
      }),
      cacheRsp = await VideoDetailsByVideoIdsCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.videoDetailsMap = cacheRsp.data;

    let descriptionIds = [],
      allLinkIds = [];
    for (let videoId in oThis.videoDetailsMap) {
      let videoDetail = oThis.videoDetailsMap[videoId];
      oThis.creatorUserIds.push(videoDetail.creatorUserId);

      if (videoDetail.descriptionId) {
        descriptionIds.push(videoDetail.descriptionId);
      }
      if (videoDetail.linkIds) {
        allLinkIds = allLinkIds.concat(videoDetail.linkIds);
      }
    }

    oThis.allTextIds = oThis.allTextIds.concat(descriptionIds);
    oThis.allLinkIds = oThis.allLinkIds.concat(allLinkIds);
  }

  /**
   * Fetch profile of creators
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchCreatorsProfile() {
    const oThis = this;

    const getProfileObj = new GetProfileLib({
      userIds: oThis.creatorUserIds,
      currentUserId: oThis.currentUserId,
      isAdmin: oThis.isAdmin
    });

    const response = await getProfileObj.perform();

    if (response.isFailure()) {
      return Promise.reject(response);
    }

    oThis.creatorsProfileData = response.data;
  }

  /**
   * Filter videos which can be sent outside
   * @private
   */
  _filterVideosToSend() {
    const oThis = this;

    for (let videoId in oThis.videoDetailsMap) {
      let videoDetail = oThis.videoDetailsMap[videoId];
      if (!oThis.canForwardVideoDetails(videoDetail.creatorUserId)) {
        let index = oThis.videoIds.indexOf(videoId);
        if (index > -1) {
          oThis.videoIds.splice(index, 1);
        }

        delete oThis.videoDetailsMap[videoId];
      }
    }
  }

  /**
   * Fetch all associated entities
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAssociatedEntities() {
    const oThis = this;

    const associatedEntitiesResp = await new FetchAssociatedEntities({
      textIds: oThis.allTextIds,
      linkIds: oThis.allLinkIds,
      videoIds: oThis.videoIds
    }).perform();

    oThis.links = associatedEntitiesResp.data.links;
    oThis.tags = associatedEntitiesResp.data.tags;
    oThis.images = associatedEntitiesResp.data.imagesMap;
    oThis.videos = associatedEntitiesResp.data.videosMap;
    const textMap = associatedEntitiesResp.data.textMap;
    for (let videoId in oThis.videoDetailsMap) {
      let videoDetail = oThis.videoDetailsMap[videoId];
      const textId = videoDetail.descriptionId;
      oThis.videoDescriptionMap[textId] = textMap[textId];
    }
    for (let userId in oThis.creatorsProfileData.userProfilesMap) {
      let textId = oThis.creatorsProfileData.userProfilesMap[userId].bioId;
      oThis.creatorsProfileData.userProfilesMap[userId]['bio'] = textMap[textId];
    }
  }

  /**
   * Fetch video contributions.
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
   * Can forward video details
   *
   * @param creatorUserId
   * @returns {boolean}
   */
  canForwardVideoDetails(creatorUserId) {
    const oThis = this;

    if (oThis.isAdmin || oThis.currentUserId == creatorUserId) {
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

module.exports = GetAllUserVideos;
