const rootPrefix = '../../..',
  TextByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  UrlByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  UserStatByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserStatByUserIds'),
  TagByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
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
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class GetUserProfile {
  /**
   * @constructor
   *
   * @param params
   * @param {array} params.userIds - Array of user ids
   * @param {object} params.currentUserId - current user id
   * @param {array} params.videoIds - Array of video ids
   */
  constructor(params) {
    const oThis = this;

    oThis.userIds = params.userIds;
    oThis.currentUserId = params.currentUserId;
    oThis.videoIdsArray = params.videoIds || [];

    oThis.userProfilesMap = {};
    oThis.users = {};
    oThis.tokenUsersByUserIdMap = {};
    oThis.userProfileAllowedActions = {};
    oThis.images = {};
    oThis.videos = {};
    oThis.links = {};
    oThis.tags = {};
    oThis.userStatMap = {};
    oThis.videoDetails = {};
    oThis.imageIdsArray = [];
    oThis.currentUserUserContributionsMap = {};
    oThis.currentUserVideoContributionsMap = {};
    oThis.pricePoints = {};
    oThis.allLinkIds = [];
    oThis.allTextIds = [];
    oThis.finalUserRsp = {};
    oThis.finalVideoRsp = {};
    oThis.textIdToUserIdMap = {};
  }

  /**
   * Perform.
   *
   * @return {Promise<{}>}
   */
  async perform() {
    const oThis = this;

    let promiseArray = [];

    oThis._setUserProfile();

    promiseArray.push(
      oThis._fetchUserStats(),
      oThis._fetchUser(),
      oThis._fetchTokenUser(),
      oThis._fetchUserContributions(),
      oThis._fetchPricePoints()
    );

    await oThis._fetchProfileElements();

    promiseArray.push(
      oThis._fetchLink(),
      oThis._fetchBio(),
      oThis._fetchVideo(),
      oThis._fetchVideoDetails(),
      oThis._fetchVideoContributions()
    );

    await Promise.all(promiseArray);

    await oThis._fetchImage();

    await oThis._processPendingTransactions();

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
      videoDetailsMap: oThis.videoDetails,
      currentUserUserContributionsMap: oThis.currentUserUserContributionsMap,
      currentUserVideoContributionsMap: oThis.currentUserVideoContributionsMap,
      pricePointsMap: oThis.pricePoints
    };

    console.log('The finalResponse is : ', finalResponse);

    return responseHelper.successWithData(finalResponse);
  }

  /**
   * Set user profile.
   *
   * @private
   */
  _setUserProfile() {
    const oThis = this;

    for (let i = 0; i < oThis.userIds.length; i++) {
      let userId = oThis.userIds[i];

      oThis.userProfilesMap[userId] = {
        id: userId,
        userId: userId,
        bio: null,
        linkIds: [],
        coverVideoId: null,
        coverImageId: null,
        updatedAt: null
      };

      oThis._getUserProfileAllowedActions(userId);
    }
  }

  /**
   * Get user profile allowed actions.
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

    const userStatByUserIdsCacheObj = new UserStatByUserIdsCache({ userIds: oThis.userIds }),
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
  async _fetchUser() {
    const oThis = this;

    const cacheRsp = await new UserMultiCache({ ids: oThis.userIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.users = cacheRsp.data;

    for (let userId in oThis.users) {
      let profileImageId = oThis.users[userId].profileImageId;

      if (profileImageId) {
        oThis.imageIdsArray.push(profileImageId);
      }
    }
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

    const tokenUserRes = await new TokenUserDetailByUserIdsCache({ userIds: oThis.userIds }).fetch();

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
        userIds: oThis.userIds
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
   * Fetch profile elements.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileElements() {
    const oThis = this;

    const cacheRsp = await new UserProfileElementsByUserIdCache({ usersIds: oThis.userIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }
    let profileElementsData = cacheRsp.data;

    for (let userId in profileElementsData) {
      let profileElements = profileElementsData[userId],
        updatedAt = 0;

      for (let kind in profileElements) {
        if (kind !== userProfileElementConst.linkIdKind && kind !== userProfileElementConst.bioIdKind) {
          oThis.userProfilesMap[userId][kind] = profileElements[kind].data;
        }

        if (updatedAt < profileElements[kind].updatedAt) {
          updatedAt = profileElements[kind].updatedAt;
        }

        await oThis._fetchElementData(userId, kind, profileElements[kind].data);
      }

      oThis.userProfilesMap[userId]['updatedAt'] = updatedAt;
    }
  }

  /**
   * Fetch videos
   *
   * @return {Promise<never>}
   * @private
   */
  async _fetchVideo() {
    const oThis = this;

    console.log('oThis.videoIdsArray is : ', oThis.videoIdsArray);
    oThis.videoIdsArray = [...new Set(oThis.videoIdsArray)];

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
   * @returns {Promise<never>}
   * @private
   */
  async _fetchVideoDetails() {
    const oThis = this;

    console.log('_fetchVideoDetails is : ', oThis.videoIdsArray);

    const VideoDetailsByVideoIdsCacheObj = new VideoDetailsByVideoIds({
        videoIds: oThis.videoIdsArray
      }),
      cacheRsp = await VideoDetailsByVideoIdsCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.videoDetails = cacheRsp.data;
  }

  /**
   * Fetch video contributions.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideoContributions() {
    const oThis = this;

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

    const cacheRsp = await new ImageByIdCache({ ids: oThis.imageIdsArray }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.images = cacheRsp.data;
  }

  /**
   * Fetch element data
   *
   * @param {number} userId - profile element userId
   * @param {string} kind - profile element kind
   * @param {number} data - profile element data
   * @return {Promise<void>}
   * @private
   */
  async _fetchElementData(userId, kind, data) {
    const oThis = this;

    switch (kind) {
      case userProfileElementConst.coverImageIdKind:
        oThis.imageIdsArray.push(data);
        return;

      case userProfileElementConst.coverVideoIdKind:
        oThis.videoIdsArray.push(data);
        return;

      case userProfileElementConst.bioIdKind:
        oThis.allTextIds.push(data);
        oThis.textIdToUserIdMap[data] = userId;
        return;

      case userProfileElementConst.linkIdKind:
        oThis.allLinkIds.push(data);
        oThis.userProfilesMap[userId]['linkIds'].push(data);
        return;

      default:
        logger.error('Invalid profile element kind');
    }
  }

  /**
   * Fetch bio
   *
   * @param {number} textId
   * @return {Promise<never>}
   * @private
   */
  async _fetchBio() {
    const oThis = this;

    if (oThis.allTextIds.length == 0) {
      return responseHelper.successWithData({});
    }

    let cacheRsp = await new TextByIdCache({ ids: oThis.allTextIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }
    let textData = cacheRsp.data,
      allTagIds = [];

    for (let textId in textData) {
      let tagIds = JSON.parse(textData[textId].tagIds);
      if (tagIds && tagIds.length > 0) {
        allTagIds = allTagIds.concat(tagIds);
      }
    }
    let uniqTagIds = [...new Set(allTagIds)];
    await oThis._fetchTags(uniqTagIds);

    for (let textId in textData) {
      let userId = oThis.textIdToUserIdMap[textId];

      let userBio = {
        text: textData[textId].text,
        includes: {}
      };

      let tagIds = JSON.parse(textData[textId].tagIds);
      if (tagIds) {
        for (let i = 0; i < tagIds.length; i++) {
          let tagId = tagIds[i],
            tagDetail = oThis.tags[tagId],
            tagName = '#' + tagDetail.name;

          userBio.includes[tagName] = {
            kind: 'tags',
            id: tagDetail.id
          };
        }
      }

      oThis.userProfilesMap[userId]['bio'] = userBio;
    }
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
   * @param linkId
   * @return {Promise<never>}
   * @private
   */
  async _fetchLink() {
    const oThis = this;

    if (oThis.allLinkIds.length == 0) {
      return responseHelper.successWithData({});
    }

    let cacheRsp = await new UrlByIdCache({ ids: oThis.allLinkIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.links = cacheRsp.data;
  }

  async _processPendingTransactions() {
    const oThis = this;

    let cacheRsp = await new PendingTransactionsByVideoIdsAndFromUserIdCache({
      fromUserId: oThis.currentUserId,
      videoIds: oThis.videoIdsArray
    }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    console.log('The cacheRsp is : ', cacheRsp);

    oThis.pendingTransactionsByVideoIds = cacheRsp.data;

    let videoDetails = {
      totalAmount: 0,
      totalTransaction: 0,
      uts: 0
    };

    for (let videoId in oThis.pendingTransactionsByVideoIds) {
      let pendingTransactionsByVideoIdArray = oThis.pendingTransactionsByVideoIds[videoId];
      oThis.finalVideoRsp[videoId] = { ...videoDetails };
      console.log('The pendingTransactionsByVideoIdArray is : ', pendingTransactionsByVideoIdArray);

      for (let index = 0; index < pendingTransactionsByVideoIdArray.length; index++) {
        let videoEntity = pendingTransactionsByVideoIdArray[index];
        oThis.finalVideoRsp[videoId].totalAmount += Number(videoEntity.amount);
        oThis.finalVideoRsp[videoId].totalTransaction += 1;
        if (oThis.finalVideoRsp[videoId].uts < videoEntity.updatedAt) {
          oThis.finalVideoRsp[videoId].uts = videoEntity.updatedAt;
        }
      }
    }

    console.log('The finalVideoRsp is : ', oThis.finalVideoRsp);

    let PendingTransactionsByToUserIdsAndFromUserIdCacheRsp = await new PendingTransactionsByToUserIdsAndFromUserIdCache(
      { fromUserId: oThis.currentUserId, toUserIds: [1000, 1001] }
    ).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    console.log(
      'The PendingTransactionsByToUserIdsAndFromUserIdCacheRsp is : ',
      PendingTransactionsByToUserIdsAndFromUserIdCacheRsp
    );

    oThis.pendingTransactionsByToUserIds = PendingTransactionsByToUserIdsAndFromUserIdCacheRsp.data;

    let userDetails = {
      totalAmount: 0,
      totalTransaction: 0,
      uts: 0
    };

    for (let toUserId in oThis.pendingTransactionsByToUserIds) {
      let pendingTransactionsByToUserIdArray = oThis.pendingTransactionsByToUserIds[toUserId];
      oThis.finalUserRsp[toUserId] = { ...userDetails };
      console.log('The pendingTransactionsByToUserIdArray is : ', pendingTransactionsByToUserIdArray);

      for (let index = 0; index < pendingTransactionsByToUserIdArray.length; index++) {
        let userEntity = pendingTransactionsByToUserIdArray[index];
        oThis.finalUserRsp[toUserId].totalAmount += Number(userEntity.amount);
        oThis.finalUserRsp[toUserId].totalTransaction += 1;
        if (oThis.finalUserRsp[toUserId].uts < userEntity.updatedAt) {
          oThis.finalUserRsp[toUserId].uts = userEntity.updatedAt;
        }
      }
    }

    console.log('The oThis.finalUserRsp is : ', oThis.finalUserRsp);

    oThis._updateUserStats();
    oThis._updateVideoDetails();
    oThis._updateCurrentUserUserContributions();
    oThis._updateCurrentUserVideoContributions();
  }

  _updateUserStats() {
    const oThis = this;
    for (let userId in oThis.userStatMap) {
      if (oThis.finalUserRsp[userId]) {
        oThis.userStatMap[userId].totalAmountRaised = oThis.finalUserRsp[userId].totalAmount;
        oThis.userStatMap[userId].updatedAt = oThis.finalUserRsp[userId].uts;
      }
    }
  }

  _updateVideoDetails() {}

  _updateCurrentUserUserContributions() {}

  _updateCurrentUserVideoContributions() {}
}

module.exports = GetUserProfile;
