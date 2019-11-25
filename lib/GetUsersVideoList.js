const rootPrefix = '..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  GetProfileLib = require(rootPrefix + '/lib/user/profile/Get'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  FetchAssociatedEntities = require(rootPrefix + '/lib/FetchAssociatedEntities'),
  UserVideoViewModel = require(rootPrefix + '/app/models/cassandra/UserVideoView'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  VideoDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  ReplyDetailsByEntityIdsAndEntityKindCache = require(rootPrefix +
    '/lib/cacheManagement/multi/ReplyDetailsByEntityIdsAndEntityKind'),
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
    oThis.videoRspForPendingTransaction = {};
    oThis.currentUserVideoRelations = {};
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

    await oThis._fetchCreatorsProfile();

    // Filter videos which can be sent outside.
    oThis._filterVideosToSend();

    const promisesArray = [];
    promisesArray.push(
      oThis._fetchAssociatedEntities(),
      oThis._fetchVideoContributions(),
      oThis._fetchUserPendingTransactionsOnVideos(),
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
      replyDetailsMap: oThis.replyDetailsMap,
      videoDescriptionMap: oThis.videoDescriptionMap,
      currentUserVideoContributionsMap: oThis.currentUserVideoContributionsMap,
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
  async _fetchAllVideoDetails() {
    const oThis = this;

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

    // If reply details are present.
    if (oThis.replyDetailIds.length > 0) {
      await oThis._fetchReplyDetailsById();
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

    const replyDetailsByVideoIdsCacheObj = new ReplyDetailsByEntityIdsAndEntityKindCache({
        entityIds: videoIds,
        entityKind: replyDetailConstants.videoEntityKind
      }),
      cacheRsp = await replyDetailsByVideoIdsCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    const replyDetailIds = [];
    for (const vid in cacheRsp.data) {
      const rdId = cacheRsp.data[vid];
      if (!CommonValidators.isVarNullOrUndefined(rdId)) {
        replyDetailIds.push(rdId);
      }
    }

    const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: replyDetailIds }).fetch();
    if (replyDetailCacheResp.isFailure()) {
      logger.error('Error while fetching reply detail data.');

      return Promise.reject(replyDetailCacheResp);
    }

    for (const rdId in replyDetailCacheResp.data) {
      const rdObj = replyDetailCacheResp.data[rdId];
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
   * Update all contributions in details map
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
        if (!CommonValidators.validateNonEmptyObject(oThis.currentUserVideoContributionsMap[videoId])) {
          detailObj.totalContributedBy += 1;
        }
        // If its reply entity then update in reply detail map or video detail map
        if (isReplyEntity) {
          oThis.replyDetailsMap[videoEntity.replyDetailId] = detailObj;
        } else {
          oThis.videoDetailsMap[videoId] = detailObj;
        }
      }
    }
    oThis._updateCurrentUserVideoContributions();
  }

  /**
   * Update current user video contributions
   *
   * @private
   */
  _updateCurrentUserVideoContributions() {
    const oThis = this;
    for (const videoId in oThis.videoRspForPendingTransaction) {
      // If there is entry in pending transactions then only proceed further.
      if (oThis.currentUserVideoContributionsMap[videoId]) {
        if (CommonValidators.validateNonEmptyObject(oThis.currentUserVideoContributionsMap[videoId])) {
          oThis.currentUserVideoContributionsMap[videoId].totalAmount = basicHelper.convertToBigNumberAndAdd(
            oThis.currentUserVideoContributionsMap[videoId].totalAmount,
            oThis.videoRspForPendingTransaction[videoId].totalAmount
          );
          oThis.currentUserVideoContributionsMap[videoId].totalTransactions +=
            oThis.videoRspForPendingTransaction[videoId].totalTransaction;
          if (
            oThis.currentUserVideoContributionsMap[videoId].updatedAt < oThis.videoRspForPendingTransaction[videoId].uts
          ) {
            oThis.currentUserVideoContributionsMap[videoId].updatedAt =
              oThis.videoRspForPendingTransaction[videoId].uts;
          }
        } else {
          oThis.currentUserVideoContributionsMap[videoId].id = -1;
          oThis.currentUserVideoContributionsMap[videoId].videoId = videoId;
          oThis.currentUserVideoContributionsMap[videoId].contributedByUserId = oThis.currentUserId;
          oThis.currentUserVideoContributionsMap[videoId].totalAmount = oThis.videoRspForPendingTransaction[
            videoId
          ].totalAmount.toString();
          oThis.currentUserVideoContributionsMap[videoId].totalTransactions =
            oThis.videoRspForPendingTransaction[videoId].totalTransaction;
          oThis.currentUserVideoContributionsMap[videoId].createdAt = oThis.videoRspForPendingTransaction[videoId].uts;
          oThis.currentUserVideoContributionsMap[videoId].updatedAt = oThis.videoRspForPendingTransaction[videoId].uts;
        }
      }
    }
  }

  /**
   * Set current user video relations.
   *
   * @sets oThis.currentUserVideoRelations
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setCurrentUserVideoRelations() {
    const oThis = this;

    if (!oThis.fetchVideoViewDetails) {
      return responseHelper.successWithData({});
    }

    const videoIdToUserVideoViewMap = await new UserVideoViewModel().fetchVideoViewDetails({
      userId: oThis.currentUserId,
      videoIds: oThis.videoIds
    });

    for (let ind = 0; ind < oThis.videoIds.length; ind++) {
      const vid = oThis.videoIds[ind],
        userVideoViewObj = videoIdToUserVideoViewMap[Number(vid)],
        videoMap = oThis.fullVideosMap[vid];

      oThis.currentUserVideoRelations[vid] = oThis.currentUserVideoRelations[vid] || {};
      oThis.currentUserVideoRelations[vid].hasSeen = 0;
      if (userVideoViewObj && userVideoViewObj.lastViewAt) {
        oThis.currentUserVideoRelations[vid].hasSeen = 1;
      }
      // Set canDelete.
      oThis.currentUserVideoRelations[vid].canDelete = 0;
      // If current user is creator of video.
      if (oThis.currentUserId == videoMap.creatorUserId) {
        oThis.currentUserVideoRelations[vid].canDelete = 1;
      } else if (videoMap.replyDetailId) {
        // In case of reply, parent video owner can delete reply video too.
        const parentVideoId = oThis.replyDetailsMap[videoMap.replyDetailId].parentId;
        if (oThis.currentUserId == oThis.fullVideosMap[parentVideoId].creatorUserId) {
          oThis.currentUserVideoRelations[vid].canDelete = 1;
        }
      }
    }
  }
}

module.exports = GetUsersVideoList;
