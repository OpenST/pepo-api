const rootPrefix = '../../..',
  TextByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  UrlByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds'),
  TagByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  UserStatByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserStatByUserIds'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  PricePointsCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  VideoDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  UserContributorByUserIdsAndContributedByUserId = require(rootPrefix +
    '/lib/cacheManagement/multi/UserContributorByUserIdsAndContributedByUserId'),
  VideoContributorByVideoIdsAndContributedByUserId = require(rootPrefix +
    '/lib/cacheManagement/multi/VideoContributorByVideoIdsAndContributedByUserId'),
  PendingTransactionsByVideoIdsAndFromUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/multi/PendingTransactionsByVideoIdsAndFromUserId.js'),
  PendingTransactionsByToUserIdsAndFromUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/multi/PendingTransactionsByToUserIdsAndFromUserId.js'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class GetUserProfile {
  /**
   * @constructor
   *
   * @param params
   * @param {array} params.userIds - Array of user ids
   * @param {object} params.currentUserId - current user id
   * @param {boolean} params.isAdmin - flag to determine if current user is an admin or not.
   * @param {array} params.videoIds - Array of video ids
   */
  constructor(params) {
    const oThis = this;

    oThis.userIds = params.userIds;
    oThis.currentUserId = params.currentUserId;
    oThis.isAdmin = params.isAdmin || false;
    oThis.videoIdsArray = params.videoIds || [];

    oThis.activeUserIds = [];
    oThis.userProfilesMap = {};
    oThis.users = {};
    oThis.tokenUsersByUserIdMap = {};
    oThis.userProfileAllowedActions = {};
    oThis.images = {};
    oThis.videos = {};
    oThis.links = {};
    oThis.tags = {};
    oThis.userStatMap = {};
    oThis.videoDetailsMap = {};
    oThis.descriptionIds = [];
    oThis.videoDescriptionMap = {};
    oThis.textData = {};
    oThis.imageIdsArray = [];
    oThis.currentUserUserContributionsMap = {};
    oThis.currentUserVideoContributionsMap = {};
    oThis.pricePoints = {};
    oThis.allLinkIds = [];
    oThis.allTextIds = [];
    oThis.userRspForPendingTransaction = {};
    oThis.videoRspForPendingTransaction = {};
    oThis.textIdToUserIdMap = {};
    oThis.twitterUsersMap = {};
  }

  /**
   * Perform.
   *
   * @return {Promise<{}>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchUsers();

    // If active users are present
    if (oThis.activeUserIds.length > 0) {
      await oThis._fetchProfileElements();

      let promiseArray = [];

      promiseArray.push(
        oThis._fetchUserStats(),
        oThis._fetchTokenUser(),
        oThis._fetchUserContributions(),
        oThis._fetchPricePoints(),
        oThis._fetchTwitterUsers()
      );

      await oThis._fetchVideoDetails();

      promiseArray.push(
        oThis._fetchTagAndLinkDetails(),
        oThis._fetchVideo(),
        oThis._fetchVideoContributions(),
        oThis._fetchPendingTransactions()
      );

      await Promise.all(promiseArray);

      await oThis._fetchImage();

      oThis._processPendingTransactions();
    }

    const finalResponse = {
      userProfilesMap: oThis.userProfilesMap,
      userProfileAllowedActions: oThis.userProfileAllowedActions,
      usersByIdMap: oThis.users,
      tokenUsersByUserIdMap: oThis.tokenUsersByUserIdMap,
      imageMap: oThis.images,
      videoMap: oThis.videos,
      linkMap: oThis.links,
      tags: oThis.tags,
      userStat: oThis.userStatMap,
      videoDetailsMap: oThis.videoDetailsMap,
      videoDescriptionMap: oThis.videoDescriptionMap,
      currentUserUserContributionsMap: oThis.currentUserUserContributionsMap,
      currentUserVideoContributionsMap: oThis.currentUserVideoContributionsMap,
      pricePointsMap: oThis.pricePoints,
      twitterUsersMap: oThis.twitterUsersMap
    };

    // console.log('finalResponse-----------', JSON.stringify(finalResponse));

    return responseHelper.successWithData(finalResponse);
  }

  /**
   * Set user profile.
   *
   * @private
   */
  _setUserProfile() {
    const oThis = this;

    for (let i = 0; i < oThis.activeUserIds.length; i++) {
      let activeUserId = oThis.activeUserIds[i];

      oThis.userProfilesMap[activeUserId] = {
        id: activeUserId,
        userId: activeUserId,
        bio: null,
        linkIds: [],
        updatedAt: null
      };

      oThis._getUserProfileAllowedActions(activeUserId);
    }
  }

  /**
   * Get user profile allowed actions.
   *
   * @Sets oThis.userProfileAllowedActions
   *
   * @private
   */
  _getUserProfileAllowedActions(userId) {
    const oThis = this;

    oThis.userProfileAllowedActions[userId] = oThis.userProfileAllowedActions[userId] || {};
    if (userId === oThis.currentUserId) {
      oThis.userProfileAllowedActions[userId]['editProfile'] = 1;
    } else {
      oThis.userProfileAllowedActions[userId]['editProfile'] = 0;
    }
  }

  /**
   * Fetch user stats
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUserStats() {
    const oThis = this;

    const userStatByUserIdsCacheObj = new UserStatByUserIdsCache({ userIds: oThis.activeUserIds }),
      cacheRsp = await userStatByUserIdsCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.userStatMap = cacheRsp.data;
  }

  /**
   * Fetch user.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    const cacheRsp = await new UserMultiCache({ ids: oThis.userIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.users = cacheRsp.data;

    for (let i = 0; i < oThis.userIds.length; i++) {
      const userId = oThis.userIds[i],
        userObj = oThis.users[userId];
      // If user is not found or its inactive

      if (!oThis.forwardProfile(userObj)) {
        delete oThis.users[userId];
        continue;
      }
      oThis.activeUserIds.push(userId);
      let profileImageId = userObj.profileImageId;

      if (profileImageId) {
        oThis.imageIdsArray.push(profileImageId);
      }
    }

    oThis._setUserProfile();
  }

  /**
   * Fetch token user.
   *
   * @sets oThis.tokenUsersByUserIdMap
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    logger.log('Fetching token user.');

    const tokenUserRes = await new TokenUserDetailByUserIdsCache({ userIds: oThis.activeUserIds }).fetch();

    if (tokenUserRes.isFailure()) {
      return Promise.reject(tokenUserRes);
    }

    oThis.tokenUsersByUserIdMap = tokenUserRes.data;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch user contributions.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserContributions() {
    const oThis = this;

    const userContributorByUserIdsAndContributedByUserIdCacheRsp = await new UserContributorByUserIdsAndContributedByUserId(
      {
        contributedByUserId: oThis.currentUserId,
        userIds: oThis.activeUserIds
      }
    ).fetch();

    if (userContributorByUserIdsAndContributedByUserIdCacheRsp.isFailure()) {
      return Promise.reject(userContributorByUserIdsAndContributedByUserIdCacheRsp);
    }

    oThis.currentUserUserContributionsMap = userContributorByUserIdsAndContributedByUserIdCacheRsp.data;
  }

  /**
   * Fetch price points.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPricePoints() {
    const oThis = this;

    const pricePointsCacheRsp = await new PricePointsCache().fetch();

    if (pricePointsCacheRsp.isFailure()) {
      return Promise.reject(pricePointsCacheRsp);
    }

    oThis.pricePoints = pricePointsCacheRsp.data;
  }

  /**
   * Fetch Twitter User Obj if present.
   *
   * @sets oThis.twitterUsersMap
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchTwitterUsers() {
    const oThis = this;

    const twitterUserByUserIdsCacheResponse = await new TwitterUserByUserIdsCache({
      userIds: oThis.userIds
    }).fetch();

    if (twitterUserByUserIdsCacheResponse.isFailure()) {
      return Promise.reject(twitterUserByUserIdsCacheResponse);
    }

    let twitterUserIds = [];
    for (let userId in twitterUserByUserIdsCacheResponse.data) {
      if (twitterUserByUserIdsCacheResponse.data[userId].id) {
        twitterUserIds.push(twitterUserByUserIdsCacheResponse.data[userId].id);
      }
    }

    const twitterUserByIdsCacheResp = await new TwitterUserByIdsCache({
      ids: twitterUserIds
    }).fetch();

    if (twitterUserByIdsCacheResp.isFailure()) {
      return Promise.reject(twitterUserByIdsCacheResp);
    }

    for (let id in twitterUserByIdsCacheResp.data) {
      let twitterUser = twitterUserByIdsCacheResp.data[id];

      oThis.twitterUsersMap[twitterUser.userId] = twitterUser;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch profile elements.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileElements() {
    const oThis = this;

    const cacheRsp = await new UserProfileElementsByUserIdCache({ usersIds: oThis.activeUserIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }
    let profileElementsData = cacheRsp.data;

    for (let userId in profileElementsData) {
      let profileElements = profileElementsData[userId],
        updatedAt = 0;

      for (let kind in profileElements) {
        if (updatedAt < profileElements[kind].updatedAt) {
          updatedAt = profileElements[kind].updatedAt;
        }

        await oThis._fetchElementData(userId, oThis.users[userId], kind, profileElements[kind].data);
      }

      oThis.userProfilesMap[userId]['updatedAt'] = updatedAt;
    }

    oThis.videoIdsArray = [...new Set(oThis.videoIdsArray)];
  }

  /**
   * Fetch videos
   *
   * @return {Promise<never>}
   * @private
   */
  async _fetchVideo() {
    const oThis = this;

    if (oThis.videoIdsArray.length === 0) {
      return responseHelper.successWithData({});
    }

    let cacheRsp = await new VideoByIdCache({ ids: oThis.videoIdsArray }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    for (let videoId in cacheRsp.data) {
      let video = cacheRsp.data[videoId],
        posterImageId = video.posterImageId;
      if (posterImageId) {
        oThis.imageIdsArray.push(posterImageId);
      }
    }

    oThis.videos = cacheRsp.data;
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

    if (oThis.videoIdsArray.length === 0) {
      return responseHelper.successWithData({});
    }

    const VideoDetailsByVideoIdsCacheObj = new VideoDetailsByVideoIds({
        videoIds: oThis.videoIdsArray
      }),
      cacheRsp = await VideoDetailsByVideoIdsCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.videoDetailsMap = cacheRsp.data;

    let allLinkIds = [];

    for (let videoId in oThis.videoDetailsMap) {
      let videoDetail = oThis.videoDetailsMap[videoId];

      let userObj = oThis.users[videoDetail.creatorUserId];
      // If user is not found then it is inactive or if not an approved creator

      if (!oThis.forwardVideo(videoDetail.creatorUserId, userObj)) {
        let index = oThis.videoIdsArray.indexOf(videoId);
        if (index > -1) {
          oThis.videoIdsArray.splice(index, 1);
        }

        delete oThis.videoDetailsMap[videoId];
        continue;
      }

      if (videoDetail.descriptionId) {
        oThis.descriptionIds.push(videoDetail.descriptionId);
      }
      if (videoDetail.linkIds) {
        allLinkIds = allLinkIds.concat(JSON.parse(videoDetail.linkIds));
      }
    }

    oThis.allTextIds = oThis.allTextIds.concat(oThis.descriptionIds);
    oThis.allLinkIds = oThis.allLinkIds.concat(allLinkIds);
  }

  /**
   * Fetch video contributions.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideoContributions() {
    const oThis = this;

    if (oThis.videoIdsArray.length === 0) {
      return responseHelper.successWithData({});
    }

    const videoContributorByVideoIdsAndContributedByUserIdCacheRsp = await new VideoContributorByVideoIdsAndContributedByUserId(
      {
        videoIds: oThis.videoIdsArray,
        contributedByUserId: oThis.currentUserId
      }
    ).fetch();

    if (videoContributorByVideoIdsAndContributedByUserIdCacheRsp.isFailure()) {
      return Promise.reject(videoContributorByVideoIdsAndContributedByUserIdCacheRsp);
    }

    oThis.currentUserVideoContributionsMap = videoContributorByVideoIdsAndContributedByUserIdCacheRsp.data;
  }

  /**
   * Fetch image.
   *
   * @return {Promise<never>}
   * @private
   */
  async _fetchImage() {
    const oThis = this;

    if (oThis.imageIdsArray.length === 0) {
      return responseHelper.successWithData({});
    }

    const cacheRsp = await new ImageByIdCache({ ids: oThis.imageIdsArray }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.images = cacheRsp.data;
  }

  /**
   * Fetch element data.
   *
   * @param {number} userId - profile element userId
   * @param {Object} userObj - user object
   * @param {string} kind - profile element kind
   * @param {number} data - profile element data
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchElementData(userId, userObj, kind, data) {
    const oThis = this;

    switch (kind) {
      case userProfileElementConst.bioIdKind: {
        oThis.allTextIds.push(data);
        oThis.textIdToUserIdMap[data] = userId;

        return;
      }
      case userProfileElementConst.linkIdKind: {
        oThis.allLinkIds.push(data);
        oThis.userProfilesMap[userId].linkIds.push(data);

        return;
      }
      case userProfileElementConst.locationIdKind:
      case userProfileElementConst.lifetimePurchaseLimitKind: {
        return;
      }

      default:
        logger.log('Invalid profile element kind.');
    }
  }

  /**
   * Fetch tag and link details.
   *
   * @sets oThis.textData, oThis.allLinkIds
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchTagAndLinkDetails() {
    const oThis = this;

    if (oThis.allTextIds.length > 0) {
      const cacheRsp = await new TextByIdCache({ ids: oThis.allTextIds }).fetch();
      if (cacheRsp.isFailure()) {
        return Promise.reject(cacheRsp);
      }

      oThis.textData = cacheRsp.data;
    }

    let allTagIds = [],
      allLinkIds = [];

    for (const textId in oThis.textData) {
      const tagIds = JSON.parse(oThis.textData[textId].tagIds),
        linkIds = JSON.parse(oThis.textData[textId].linkIds);

      if (tagIds && tagIds.length > 0) {
        allTagIds = allTagIds.concat(tagIds);
      }
      if (oThis.textData[textId].kind === textConstants.videoDescriptionKind) {
        if (linkIds && linkIds.length > 0) {
          allLinkIds = allLinkIds.concat(linkIds);
        }
      }
    }

    const promiseArray = [],
      uniqTagIds = [...new Set(allTagIds)];

    oThis.allLinkIds = oThis.allLinkIds.concat(allLinkIds);

    promiseArray.push(oThis._fetchTags(uniqTagIds), oThis._fetchLink());

    await Promise.all(promiseArray);

    oThis._fetchBioAndVideoDescription();
  }

  /**
   * Fetch bio and video description.
   *
   * @private
   */
  _fetchBioAndVideoDescription() {
    const oThis = this;

    for (let textId in oThis.textData) {
      let userId = oThis.textIdToUserIdMap[textId];

      if (oThis.textData[textId].kind === textConstants.videoDescriptionKind) {
        let tagIds = JSON.parse(oThis.textData[textId].tagIds),
          linkIds = JSON.parse(oThis.textData[textId].linkIds);

        let videoDescription = oThis._formatTags(tagIds, textId);

        if (linkIds) {
          for (let i = 0; i < linkIds.length; i++) {
            let linkId = linkIds[i];

            videoDescription.includes[oThis.links[linkId].url] = {
              kind: 'links',
              id: linkId
            };
          }
        }

        oThis.videoDescriptionMap[textId] = videoDescription;
      } else if (oThis.textData[textId].kind === textConstants.bioKind) {
        let tagIds = JSON.parse(oThis.textData[textId].tagIds);

        oThis.userProfilesMap[userId]['bio'] = oThis._formatTags(tagIds, textId);
      }
    }
  }

  /**
   * Format tags.
   *
   * @param tagIds
   * @param textId
   * @returns {{text: *, includes: {}}}
   * @private
   */
  _formatTags(tagIds, textId) {
    const oThis = this;

    const textData = {
      text: oThis.textData[textId].text,
      includes: {}
    };

    if (tagIds) {
      for (let i = 0; i < tagIds.length; i++) {
        let tagId = tagIds[i],
          tagDetail = oThis.tags[tagId],
          tagName = '#' + tagDetail.name;

        textData.includes[tagName] = {
          kind: 'tags',
          id: tagDetail.id
        };
      }
    }

    return textData;
  }

  /**
   * Fetch tags
   *
   * @param tagIds
   * @returns {Promise<*>}
   * @private
   */
  async _fetchTags(tagIds) {
    const oThis = this;

    let cacheRsp = await new TagByIdCache({ ids: tagIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.tags = cacheRsp.data;

    return cacheRsp;
  }

  /**
   * Fetch link
   *
   * @return {Promise<never>}
   * @private
   */
  async _fetchLink() {
    const oThis = this;

    oThis.allLinkIds = [...new Set(oThis.allLinkIds)];

    if (oThis.allLinkIds.length === 0) {
      return responseHelper.successWithData({});
    }

    let cacheRsp = await new UrlByIdCache({ ids: oThis.allLinkIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.links = cacheRsp.data;
  }

  /**
   * Fetch pending transactions
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchPendingTransactions() {
    const oThis = this;

    if (oThis.isAdmin) {
      return;
    }

    let pendingTransactionsByVideoIds = {};

    if (oThis.videoIdsArray.length > 0) {
      let cacheRsp = await new PendingTransactionsByVideoIdsAndFromUserIdCache({
        fromUserId: oThis.currentUserId,
        videoIds: oThis.videoIdsArray
      }).fetch();

      if (cacheRsp.isFailure()) {
        return Promise.reject(cacheRsp);
      }

      pendingTransactionsByVideoIds = cacheRsp.data;

      let pendingTransactionsForVideoEntity = {
        totalAmount: 0,
        totalTransaction: 0,
        uts: 0
      };

      for (let videoId in pendingTransactionsByVideoIds) {
        let pendingTransactionsByVideoIdArray = pendingTransactionsByVideoIds[videoId];
        if (pendingTransactionsByVideoIdArray.length > 0) {
          oThis.videoRspForPendingTransaction[videoId] = { ...pendingTransactionsForVideoEntity };

          for (let index = 0; index < pendingTransactionsByVideoIdArray.length; index++) {
            let videoEntity = pendingTransactionsByVideoIdArray[index];
            oThis.videoRspForPendingTransaction[videoId].totalAmount = oThis._convertToBigNumberAndAdd(
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

    let index = oThis.activeUserIds.indexOf(oThis.currentUserId);
    let userIdsToCheck = oThis.activeUserIds;
    userIdsToCheck.splice(index, index);

    if (userIdsToCheck.length > 0) {
      let PendingTransactionsByToUserIdsAndFromUserIdCacheRsp = await new PendingTransactionsByToUserIdsAndFromUserIdCache(
        { fromUserId: oThis.currentUserId, toUserIds: userIdsToCheck }
      ).fetch();

      if (PendingTransactionsByToUserIdsAndFromUserIdCacheRsp.isFailure()) {
        return Promise.reject(PendingTransactionsByToUserIdsAndFromUserIdCacheRsp);
      }

      let pendingTransactionsByToUserIds = PendingTransactionsByToUserIdsAndFromUserIdCacheRsp.data;

      let pendingTransactionForUserEntity = {
        totalAmount: 0,
        totalTransaction: 0,
        uts: 0
      };

      for (let toUserId in pendingTransactionsByToUserIds) {
        let pendingTransactionsByToUserIdArray = pendingTransactionsByToUserIds[toUserId];
        if (pendingTransactionsByToUserIdArray.length > 0) {
          oThis.userRspForPendingTransaction[toUserId] = { ...pendingTransactionForUserEntity };

          for (let index = 0; index < pendingTransactionsByToUserIdArray.length; index++) {
            let userEntity = pendingTransactionsByToUserIdArray[index];
            oThis.userRspForPendingTransaction[toUserId].totalAmount = oThis._convertToBigNumberAndAdd(
              oThis.userRspForPendingTransaction[toUserId].totalAmount,
              userEntity.amount
            );
            oThis.userRspForPendingTransaction[toUserId].totalTransaction += 1;
            if (oThis.userRspForPendingTransaction[toUserId].uts < userEntity.updatedAt) {
              oThis.userRspForPendingTransaction[toUserId].uts = userEntity.updatedAt;
            }
          }
        }
      }
    }
  }

  /**
   * Process Pending Transactions
   *
   * @private
   */
  _processPendingTransactions() {
    const oThis = this;

    oThis._updateUserStats();
    oThis._updateVideoDetails();
    oThis._updateCurrentUserUserContributions();
    oThis._updateCurrentUserVideoContributions();
  }

  /**
   * Update user stats
   *
   * @private
   */
  _updateUserStats() {
    const oThis = this;
    for (let userId in oThis.userRspForPendingTransaction) {
      if (oThis.userStatMap[userId] && CommonValidators.validateNonEmptyObject(oThis.userStatMap[userId])) {
        oThis.userStatMap[userId].totalAmountRaised = oThis._convertToBigNumberAndAdd(
          oThis.userStatMap[userId].totalAmountRaised,
          oThis.userRspForPendingTransaction[userId].totalAmount
        );
        if (oThis.userStatMap[userId].updatedAt < oThis.userRspForPendingTransaction[userId].uts) {
          oThis.userStatMap[userId].updatedAt = oThis.userRspForPendingTransaction[userId].uts;
        }
        if (!CommonValidators.validateNonEmptyObject(oThis.currentUserUserContributionsMap[userId])) {
          oThis.userStatMap[userId].totalContributedBy += 1;
        }
      } else {
        oThis.userStatMap[userId].id = -1;
        oThis.userStatMap[userId].userId = userId;
        oThis.userStatMap[userId].totalContributedBy = 1;
        oThis.userStatMap[userId].totalContributedTo = 0;
        oThis.userStatMap[userId].totalAmountSpent = 0;
        oThis.userStatMap[userId].totalAmountRaised = oThis.userRspForPendingTransaction[userId].totalAmount;
        oThis.userStatMap[userId].createdAt = oThis.userRspForPendingTransaction[userId].uts;
        oThis.userStatMap[userId].updatedAt = oThis.userRspForPendingTransaction[userId].uts;
      }
    }
  }

  /**
   * Update video details
   *
   * @private
   */
  _updateVideoDetails() {
    const oThis = this;
    for (let videoId in oThis.videoRspForPendingTransaction) {
      if (oThis.videoDetailsMap[videoId] && CommonValidators.validateNonEmptyObject(oThis.videoDetailsMap[videoId])) {
        oThis.videoDetailsMap[videoId].totalTransactions +=
          oThis.videoRspForPendingTransaction[videoId].totalTransaction;

        oThis.videoDetailsMap[videoId].totalAmount = oThis._convertToBigNumberAndAdd(
          oThis.videoDetailsMap[videoId].totalAmount,
          oThis.videoRspForPendingTransaction[videoId].totalAmount
        );
        if (oThis.videoDetailsMap[videoId].updatedAt < oThis.videoRspForPendingTransaction[videoId].uts) {
          oThis.videoDetailsMap[videoId].updatedAt = oThis.videoRspForPendingTransaction[videoId].uts;
        }
        if (!CommonValidators.validateNonEmptyObject(oThis.currentUserVideoContributionsMap[videoId])) {
          oThis.videoDetailsMap[videoId].totalContributedBy += 1;
        }
      }
    }
  }

  /**
   * Update current user user contributions
   *
   * @private
   */
  _updateCurrentUserUserContributions() {
    const oThis = this;
    for (let userId in oThis.userRspForPendingTransaction) {
      // if there is entry in pending transactions then only proceed further
      if (oThis.currentUserUserContributionsMap[userId]) {
        if (CommonValidators.validateNonEmptyObject(oThis.currentUserUserContributionsMap[userId])) {
          oThis.currentUserUserContributionsMap[userId].totalAmount = oThis._convertToBigNumberAndAdd(
            oThis.currentUserUserContributionsMap[userId].totalAmount,
            oThis.userRspForPendingTransaction[userId].totalAmount
          );
          oThis.currentUserUserContributionsMap[userId].totalTransactions +=
            oThis.userRspForPendingTransaction[userId].totalTransaction;

          if (
            oThis.currentUserUserContributionsMap[userId].updatedAt < oThis.userRspForPendingTransaction[userId].uts
          ) {
            oThis.currentUserUserContributionsMap[userId].updatedAt = oThis.userRspForPendingTransaction[userId].uts;
          }
        } else {
          oThis.currentUserUserContributionsMap[userId].id = -1;
          oThis.currentUserUserContributionsMap[userId].userId = userId;
          oThis.currentUserUserContributionsMap[userId].contributedByUserId = oThis.currentUserId;
          oThis.currentUserUserContributionsMap[userId].totalAmount = oThis.userRspForPendingTransaction[
            userId
          ].totalAmount.toString();
          oThis.currentUserUserContributionsMap[userId].totalTransactions =
            oThis.userRspForPendingTransaction[userId].totalTransaction;
          oThis.currentUserUserContributionsMap[userId].createdAt = oThis.userRspForPendingTransaction[userId].uts;
          oThis.currentUserUserContributionsMap[userId].updatedAt = oThis.userRspForPendingTransaction[userId].uts;
        }
      }
    }
  }

  /**
   * Update current user video contributions
   *
   * @private
   */
  _updateCurrentUserVideoContributions() {
    const oThis = this;
    for (let videoId in oThis.videoRspForPendingTransaction) {
      // if there is entry in pending transactions then only proceed further
      if (oThis.currentUserVideoContributionsMap[videoId]) {
        if (CommonValidators.validateNonEmptyObject(oThis.currentUserVideoContributionsMap[videoId])) {
          oThis.currentUserVideoContributionsMap[videoId].totalAmount = oThis._convertToBigNumberAndAdd(
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
   * Forward profile or not.
   *
   * @param {object} userObj
   *
   * @returns {boolean}
   */
  forwardProfile(userObj) {
    const oThis = this;

    if (!CommonValidators.validateNonEmptyObject(userObj)) {
      return false;
    }

    if (oThis.isAdmin) {
      return true;
    }

    return userObj.status !== userConstants.inActiveStatus;
  }

  /**
   * Forward video or not.
   *
   * @param {number} userId
   * @param {object} userObj
   *
   * @returns {boolean}
   */
  forwardVideo(userId, userObj) {
    const oThis = this;

    if (oThis.isAdmin) {
      return true;
    }

    if (!CommonValidators.validateNonEmptyObject(userObj) || userObj.status === userConstants.inActiveStatus) {
      return false;
    }

    return oThis.currentUserId == userId || UserModel.isUserApprovedCreator(userObj);
  }

  /**
   * This function converts given numbers to bignumber and adds them.
   *
   * @param number1
   * @param number2
   * @returns {string}
   * @private
   */
  _convertToBigNumberAndAdd(number1, number2) {
    return basicHelper
      .convertToBigNumber(number1)
      .plus(basicHelper.convertToBigNumber(number2))
      .toString(10);
  }
}

module.exports = GetUserProfile;
