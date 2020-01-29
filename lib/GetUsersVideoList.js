const rootPrefix = '..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  GetProfileLib = require(rootPrefix + '/lib/user/profile/Get'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  FetchAssociatedEntities = require(rootPrefix + '/lib/FetchAssociatedEntities'),
  UserVideoViewModel = require(rootPrefix + '/app/models/cassandra/UserVideoView'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  VideoDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  VideoDistinctReplyCreatorsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDistinctReplyCreators'),
  PendingTransactionsByVideoIdsAndFromUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/multi/PendingTransactionsByVideoIdsAndFromUserId.js'),
  VideoContributorByVideoIdsAndContributedByUserId = require(rootPrefix +
    '/lib/cacheManagement/multi/VideoContributorByVideoIdsAndContributedByUserId'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
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
   * @param {boolean} [params.fetchVideoViewDetails] // Video view details would be fetched only if this is sent true
   * @param {boolean} [params.filterUserBlockedReplies] // Replies from blocked user would be filtered only if this is sent
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
    oThis.fetchVideoViewDetails = params.fetchVideoViewDetails || 0;
    oThis.filterUserBlockedReplies = params.filterUserBlockedReplies || 0;

    oThis.videoDetailsMap = {};
    oThis.channelsMap = {};
    oThis.videoDescriptionMap = {};
    oThis.replyDetailsMap = {};
    oThis.creatorsProfileData = null;
    oThis.allTextIds = [];
    oThis.allLinkIds = [];
    oThis.profileImageIds = [];

    oThis.currentUserVideoContributionsMap = {};
    oThis.currentUserReplyDetailContributionsMap = {};
    oThis.links = {};
    oThis.tags = {};
    oThis.images = {};
    oThis.videos = {};
    oThis.fullVideosMap = {};
    oThis.videoRspForPendingTransaction = {};
    oThis.currentUserReplyRelations = {};
    oThis.currentUserVideoRelations = {};
    oThis.replyIdsToVideoIdsMap = {};
    oThis.videoIdToReplyIdMap = {};
    oThis.extraVideoIds = [];
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<result>}
   */
  async perform() {
    const oThis = this;

    await oThis._validateParams();

    await oThis._fetchAllVideoDetails();

    await oThis._fetchProfileEntities();

    // Filter videos and replies which can be sent outside.
    oThis._filterVideosToSend();

    const promisesArray = [];
    promisesArray.push(
      oThis._fetchAssociatedEntities(),
      oThis._fetchVideoContributions(),
      oThis._fetchUserPendingTransactionsOnVideos(),
      oThis._setCurrentUserReplyRelations(),
      oThis._setCurrentUserVideoRelations()
    );

    await Promise.all(promisesArray);

    // Append pending transactions amounts in video contributions
    oThis._updateContributionsForPendingTrx();

    const finalResponse = oThis.creatorsProfileData;

    Object.assign(finalResponse, {
      imageMap: oThis.images,
      videoMap: oThis.videos,
      linkMap: oThis.links,
      tags: oThis.tags,
      videoDetailsMap: oThis.videoDetailsMap,
      channelsMap: oThis.channelsMap,
      replyDetailsMap: oThis.replyDetailsMap,
      videoDescriptionMap: oThis.videoDescriptionMap,
      currentUserVideoContributionsMap: oThis.currentUserVideoContributionsMap,
      currentUserReplyDetailContributionsMap: oThis.currentUserReplyDetailContributionsMap,
      currentUserReplyDetailsRelationsMap: oThis.currentUserReplyRelations,
      currentUserVideoRelationsMap: oThis.currentUserVideoRelations,
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
  }

  /**
   * Fetch video details
   *
   * @sets oThis.videoDetailsMap
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAllVideoDetails() {
    const oThis = this;

    // If reply details are present.
    if (oThis.replyDetailIds.length > 0) {
      await oThis._fetchReplyDetailsById();
    }

    const allVideoIds = oThis.videoIds.concat(oThis.extraVideoIds);
    let allChannelIds = [];

    if (allVideoIds.length > 0) {
      const cacheRsp = await new VideoDetailsByVideoIds({
        videoIds: allVideoIds
      }).fetch();
      if (cacheRsp.isFailure()) {
        return Promise.reject(cacheRsp);
      }

      for (const vid in cacheRsp.data) {
        const vdObj = cacheRsp.data[vid];
        if (CommonValidators.validateNonEmptyObject(vdObj)) {
          oThis.videoDetailsMap[vid] = vdObj;
          if (vdObj.channelIds) {
            allChannelIds = allChannelIds.concat(vdObj.channelIds);
          }
        }
      }
      const cacheResponse = await new ChannelByIdsCache({ ids: allChannelIds }).fetch();
      if (cacheResponse.isFailure()) {
        return Promise.reject(cacheResponse);
      }

      oThis.channelsMap = cacheResponse.data;

      oThis._filterOutVideoDetails(oThis.videoDetailsMap, 'videoDetail');
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

    const replyDetailsByIdsCacheObj = new ReplyDetailsByIdsCache({
        ids: oThis.replyDetailIds
      }),
      cacheRsp = await replyDetailsByIdsCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.replyDetailsMap = cacheRsp.data;
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
      if (CommonValidators.validateNonEmptyObject(vDetail)) {
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
            oThis.replyIdsToVideoIdsMap[vDetail.id] = vdPayload.videoId;
            oThis.videoIdToReplyIdMap[vdPayload.videoId] = vDetail.id;
          }
          // Adding parent video in video ids to fetch all parent entities.
          if (vDetail.parentKind === replyDetailConstants.videoParentKind) {
            oThis.extraVideoIds.push(vDetail.parentId);
          }
          vdPayload.replyDetailId = vDetail.id;
        } else {
          vdPayload.videoId = vDetail.videoId;
          vdPayload.videoDetailId = vDetail.videoId;
        }
        oThis.fullVideosMap[vdPayload.videoId] = vdPayload;
      }
    }

    oThis.allTextIds = oThis.allTextIds.concat(descriptionIds);
    oThis.allLinkIds = oThis.allLinkIds.concat(allLinkIds);
  }

  /**
   * Fetch entities related to creator's profile
   *
   * @sets oThis.creatorsProfileData, oThis.allTextIds, oThis.allLinkIds, oThis.profileImageIds
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchProfileEntities() {
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
      if (oThis.canForwardEntity(videoDetail.creatorUserId, false)) {
        const userObj = oThis.creatorsProfileData.usersByIdMap[videoDetail.creatorUserId];
        const isApprovedCreator = UserModel.isUserApprovedCreator(userObj);

        videoDetail.isReplyAllowed = isApprovedCreator ? 1 : 0;
      } else {
        const index = oThis.videoIds.indexOf(videoId);
        if (index > -1) {
          oThis.videoIds.splice(index, 1);
        }

        delete oThis.videoDetailsMap[videoId];
        delete oThis.fullVideosMap[videoId];
      }
    }

    // Filter replies.
    if (oThis.filterUserBlockedReplies) {
      for (const replyDetailId in oThis.replyDetailsMap) {
        const replyDetail = oThis.replyDetailsMap[replyDetailId];
        if (!oThis.canForwardEntity(replyDetail.creatorUserId, true)) {
          const videoId = oThis.replyIdsToVideoIdsMap[replyDetailId],
            index = oThis.videoIds.indexOf(videoId);
          if (index > -1) {
            oThis.videoIds.splice(index, 1);
          }

          delete oThis.replyDetailsMap[replyDetailId];
          delete oThis.fullVideosMap[videoId];
          delete oThis.replyIdsToVideoIdsMap[replyDetailId];
          delete oThis.videoIdToReplyIdMap[videoId];
        }
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
    const textMap = associatedEntitiesResp.data.textMap,
      atMentionUsersMap = associatedEntitiesResp.data.usersMap,
      atMentionTokenUsersByUserIdMap = associatedEntitiesResp.data.tokenUsersByUserIdMap;

    for (const videoId in oThis.videoDetailsMap) {
      const videoDetail = oThis.videoDetailsMap[videoId];
      const textId = videoDetail.descriptionId;
      if (textId && textMap[textId]) {
        oThis.videoDescriptionMap[textId] = textMap[textId];
      }
    }

    for (const rdId in oThis.replyDetailsMap) {
      const replyDetail = oThis.replyDetailsMap[rdId];
      const textId = replyDetail.descriptionId;
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

    // Merge at-mentioned users details to users map.
    Object.assign(oThis.creatorsProfileData.usersByIdMap, atMentionUsersMap);
    Object.assign(oThis.creatorsProfileData.tokenUsersByUserIdMap, atMentionTokenUsersByUserIdMap);
  }

  /**
   * Fetch video contributions.
   *
   * @sets oThis.currentUserVideoContributionsMap, oThis.currentUserReplyDetailContributionsMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideoContributions() {
    const oThis = this;

    if (oThis.videoIds.length <= 0) {
      return responseHelper.successWithData({});
    }

    const cacheResponse = await new VideoContributorByVideoIdsAndContributedByUserId({
      videoIds: oThis.videoIds,
      contributedByUserId: oThis.currentUserId
    }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    for (let ind = 0; ind < oThis.videoIds.length; ind++) {
      const vid = oThis.videoIds[ind],
        contributionMap = cacheResponse.data[vid];

      if (oThis.videoIdToReplyIdMap[vid]) {
        oThis.currentUserReplyDetailContributionsMap[oThis.videoIdToReplyIdMap[vid]] = contributionMap;
      } else {
        oThis.currentUserVideoContributionsMap[vid] = contributionMap;
      }
    }
  }

  /**
   * Determine whether entities can be forwarded outside.
   *
   * @param {number} creatorUserId
   * @param {boolean} isReply
   *
   * @returns {boolean}
   */
  canForwardEntity(creatorUserId, isReply) {
    const oThis = this;

    if (oThis.isAdmin || oThis.currentUserId == creatorUserId) {
      return true;
    }

    return oThis.isEntityShareable(creatorUserId, isReply);
  }

  /**
   * Is entity shareable outside
   *
   * @param creatorUserId
   * @param isReply
   * @returns {boolean}
   */
  isEntityShareable(creatorUserId, isReply) {
    const oThis = this;

    const userObj = oThis.creatorsProfileData.usersByIdMap[creatorUserId];
    if (!CommonValidators.validateNonEmptyObject(userObj) || userObj.status !== userConstants.activeStatus) {
      return false;
    }

    // Current user has either blocked this user, or blocked by him
    const currentUserBlockedList = oThis.creatorsProfileData.currentUserBlockedList;
    if (currentUserBlockedList.hasBlocked[userObj.id] || currentUserBlockedList.blockedBy[userObj.id]) {
      return false;
    }

    if (isReply) {
      return true;
    }

    return UserModel.isUserApprovedCreator(userObj);
  }

  /**
   * Fetch pending transactions of current user on videos
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchUserPendingTransactionsOnVideos() {
    const oThis = this;

    if (oThis.isAdmin) {
      return;
    }

    if (oThis.videoIds.length > 0) {
      const cacheRsp = await new PendingTransactionsByVideoIdsAndFromUserIdCache({
        fromUserId: oThis.currentUserId,
        videoIds: oThis.videoIds
      }).fetch();

      if (cacheRsp.isFailure()) {
        return Promise.reject(cacheRsp);
      }

      const pendingTransactionsByVideoIds = cacheRsp.data;

      const pendingTransactionsForVideoEntity = {
        totalAmount: 0,
        totalTransaction: 0,
        uts: 0
      };

      for (const videoId in pendingTransactionsByVideoIds) {
        const pendingTransactionsByVideoIdArray = pendingTransactionsByVideoIds[videoId];
        if (pendingTransactionsByVideoIdArray.length > 0) {
          oThis.videoRspForPendingTransaction[videoId] = { ...pendingTransactionsForVideoEntity };

          for (let index = 0; index < pendingTransactionsByVideoIdArray.length; index++) {
            const videoEntity = pendingTransactionsByVideoIdArray[index];
            oThis.videoRspForPendingTransaction[videoId].totalAmount = basicHelper.convertToBigNumberAndAdd(
              oThis.videoRspForPendingTransaction[videoId].totalAmount,
              videoEntity.amount
            );
            oThis.videoRspForPendingTransaction[videoId].totalTransaction += 1;
            if (oThis.videoRspForPendingTransaction[videoId].uts < videoEntity.updatedAt) {
              oThis.videoRspForPendingTransaction[videoId].uts = videoEntity.updatedAt;
            }
          }
        }
      }
    }
  }

  /**
   * Update all contributions in details map.
   *
   * @private
   */
  _updateContributionsForPendingTrx() {
    const oThis = this;

    for (const videoId in oThis.videoRspForPendingTransaction) {
      const videoEntity = oThis.fullVideosMap[videoId];
      const isReplyEntity = !!videoEntity.replyDetailId;

      const detailObj = isReplyEntity
        ? oThis.replyDetailsMap[videoEntity.replyDetailId]
        : oThis.videoDetailsMap[videoId];

      if (CommonValidators.validateNonEmptyObject(detailObj)) {
        detailObj.totalTransactions += oThis.videoRspForPendingTransaction[videoId].totalTransaction;

        detailObj.totalAmount = basicHelper.convertToBigNumberAndAdd(
          detailObj.totalAmount,
          oThis.videoRspForPendingTransaction[videoId].totalAmount
        );
        if (detailObj.updatedAt < oThis.videoRspForPendingTransaction[videoId].uts) {
          detailObj.updatedAt = oThis.videoRspForPendingTransaction[videoId].uts;
        }
        // If its reply entity then update in reply detail map or video detail map
        if (isReplyEntity) {
          if (
            !CommonValidators.validateNonEmptyObject(
              oThis.currentUserReplyDetailContributionsMap[videoEntity.replyDetailId]
            )
          ) {
            detailObj.totalContributedBy += 1;
          }
          oThis.replyDetailsMap[videoEntity.replyDetailId] = detailObj;
        } else {
          if (!CommonValidators.validateNonEmptyObject(oThis.currentUserVideoContributionsMap[videoId])) {
            detailObj.totalContributedBy += 1;
          }
          oThis.videoDetailsMap[videoId] = detailObj;
        }
      }
    }
    oThis._updateCurrentUserContributions();
  }

  /**
   * Update current user contributions with pending transactions
   *
   * @sets oThis.currentUserReplyDetailContributionsMap, oThis.currentUserVideoContributionsMap
   *
   * @private
   */
  _updateCurrentUserContributions() {
    const oThis = this;

    for (const videoId in oThis.videoRspForPendingTransaction) {
      if (oThis.videoIdToReplyIdMap[videoId]) {
        const rdId = oThis.videoIdToReplyIdMap[videoId];
        const contributionMap = oThis.currentUserReplyDetailContributionsMap[rdId];
        oThis.currentUserReplyDetailContributionsMap[rdId] = oThis._updateContributionsMap(contributionMap, videoId);
      } else {
        const contributionMap = oThis.currentUserVideoContributionsMap[videoId];
        oThis.currentUserVideoContributionsMap[videoId] = oThis._updateContributionsMap(contributionMap, videoId);
      }
    }
  }

  /**
   * Update contribution map
   *
   * @param contributionMap
   * @param videoId
   * @returns {*}
   * @private
   */
  _updateContributionsMap(contributionMap, videoId) {
    const oThis = this;

    // If there is entry in pending transactions then only proceed further.
    if (CommonValidators.validateNonEmptyObject(oThis.videoRspForPendingTransaction[videoId])) {
      if (CommonValidators.validateNonEmptyObject(contributionMap)) {
        contributionMap.totalAmount = basicHelper.convertToBigNumberAndAdd(
          contributionMap.totalAmount,
          oThis.videoRspForPendingTransaction[videoId].totalAmount
        );
        contributionMap.totalTransactions += oThis.videoRspForPendingTransaction[videoId].totalTransaction;
        if (contributionMap.updatedAt < oThis.videoRspForPendingTransaction[videoId].uts) {
          contributionMap.updatedAt = oThis.videoRspForPendingTransaction[videoId].uts;
        }
      } else {
        contributionMap.id = -1;
        contributionMap.videoId = videoId;
        contributionMap.contributedByUserId = oThis.currentUserId;
        contributionMap.totalAmount = oThis.videoRspForPendingTransaction[videoId].totalAmount.toString();
        contributionMap.totalTransactions = oThis.videoRspForPendingTransaction[videoId].totalTransaction;
        contributionMap.createdAt = oThis.videoRspForPendingTransaction[videoId].uts;
        contributionMap.updatedAt = oThis.videoRspForPendingTransaction[videoId].uts;
      }
    }

    return contributionMap;
  }

  /**
   * Set current user video relations.
   *
   * @sets oThis.currentUserReplyRelations
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setCurrentUserReplyRelations() {
    const oThis = this;

    if (!oThis.fetchVideoViewDetails) {
      return responseHelper.successWithData({});
    }

    // For now view details are only required for replies
    const replyVideoIds = Object.values(oThis.replyIdsToVideoIdsMap);
    if (replyVideoIds.length <= 0) {
      return responseHelper.successWithData({});
    }
    const videoIdToUserVideoViewMap = await new UserVideoViewModel().fetchVideoViewDetails({
      userId: oThis.currentUserId,
      videoIds: replyVideoIds
    });

    for (const replyDetailId in oThis.replyIdsToVideoIdsMap) {
      const vid = oThis.replyIdsToVideoIdsMap[replyDetailId],
        userVideoViewObj = videoIdToUserVideoViewMap[Number(vid)],
        videoMap = oThis.fullVideosMap[vid];

      oThis.currentUserReplyRelations[replyDetailId] = oThis.currentUserReplyRelations[replyDetailId] || {};
      oThis.currentUserReplyRelations[replyDetailId].hasSeen = 0;
      if (userVideoViewObj && userVideoViewObj.lastViewAt) {
        oThis.currentUserReplyRelations[replyDetailId].hasSeen = 1;
      }
      // Set can share
      oThis.currentUserReplyRelations[replyDetailId].isShareable = oThis.isEntityShareable(videoMap.creatorUserId, true)
        ? 1
        : 0;
      // Set canDelete.
      oThis.currentUserReplyRelations[replyDetailId].canDelete = 0;
      // If current user is creator of video.
      if (oThis.currentUserId == videoMap.creatorUserId) {
        oThis.currentUserReplyRelations[replyDetailId].canDelete = 1;
      } else if (videoMap.replyDetailId) {
        // In case of reply, parent video owner can delete reply video too.
        const parentVideoId = oThis.replyDetailsMap[videoMap.replyDetailId].parentId;
        if (
          oThis.fullVideosMap[parentVideoId] &&
          oThis.currentUserId == oThis.fullVideosMap[parentVideoId].creatorUserId
        ) {
          oThis.currentUserReplyRelations[replyDetailId].canDelete = 1;
        }
      }
    }
  }

  async _setCurrentUserVideoRelations() {
    const oThis = this;

    if (oThis.videoIds.length <= 0) {
      return responseHelper.successWithData({});
    }

    const cacheResp = await new VideoDistinctReplyCreatorsCache({ videoIds: oThis.videoIds }).fetch();
    if (cacheResp.isFailure()) {
      logger.error('Error while fetching reply creators of videos.');

      return Promise.reject(cacheResp);
    }

    const videoReplyCreators = cacheResp.data;
    for (let ind = 0; ind < oThis.videoIds.length; ind++) {
      const vid = oThis.videoIds[ind],
        replyCreators = videoReplyCreators[vid],
        videoMap = oThis.fullVideosMap[vid];

      // If it belongs to video details then add that in video relations map
      if (videoMap && videoMap.videoDetailId && oThis.videoDetailsMap[videoMap.videoDetailId]) {
        const vdObj = oThis.videoDetailsMap[videoMap.videoDetailId];
        oThis.currentUserVideoRelations[vid] = oThis.currentUserVideoRelations[vid] || {};
        oThis.currentUserVideoRelations[vid].isReplyChargeable = 1;
        // Set can share
        oThis.currentUserVideoRelations[vid].isShareable = oThis.isEntityShareable(videoMap.creatorUserId, false)
          ? 1
          : 0;
        // If video belongs to current user then its free
        if (oThis.currentUserId == videoMap.creatorUserId || (vdObj && vdObj.perReplyAmountInWei == 0)) {
          oThis.currentUserVideoRelations[vid].isReplyChargeable = 0;
        } else if (CommonValidators.validateNonEmptyObject(replyCreators) && replyCreators[oThis.currentUserId]) {
          // If current user belongs to reply creators list then reply is free
          oThis.currentUserVideoRelations[vid].isReplyChargeable = 0;
        }
      }
    }
  }
}

module.exports = GetUsersVideoList;
