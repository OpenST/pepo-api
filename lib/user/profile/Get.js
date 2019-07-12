const rootPrefix = '../../..',
  TextByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  UrlByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  userStatByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserStatByUserIds'),
  TagByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  VideoDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  UserContributorByUserIdsAndContributedByUserId = require(rootPrefix +
    '/lib/cacheManagement/multi/UserContributorByUserIdsAndContributedByUserId'),
  VideoContributorByVideoIdsAndContributedByUserId = require(rootPrefix +
    '/lib/cacheManagement/multi/VideoContributorByVideoIdsAndContributedByUserId'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class GetUserProfile {
  /**
   * @constructor
   *
   * @param params
   * @param {string} params.userId - user id
   * @param {object} params.currentUserId - current user id
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.currentUserId = params.currentUserId;

    oThis.userProfile = {};
    oThis.users = {};
    oThis.tokenUser = {};
    oThis.userProfileAllowedActions = {};
    oThis.images = {};
    oThis.videos = {};
    oThis.bio = null;
    oThis.links = {};
    oThis.tags = {};
    oThis.userStat = {};
    oThis.videoDetails = {};
    oThis.imageIdsArray = [];
    oThis.videoIdsArray = [];
    oThis.currentUserUserContributionsMap = {};
    oThis.currentUserVideoContributionsMap = {};
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

    oThis._getUserProfileAllowedActions();

    promiseArray.push(
      oThis._fetchUserStats(),
      oThis._fetchUser(),
      oThis._fetchTokenUser(),
      oThis._fetchUserContributions()
    );

    await oThis._fetchProfileElements();

    promiseArray.push(oThis._fetchVideo(), oThis._fetchVideoDetails(), oThis._fetchVideoContributions());

    await Promise.all(promiseArray);

    await oThis._fetchImage();

    const finalResponse = {
      userProfileDetails: oThis.userProfile,
      usersByIdMap: oThis.users,
      tokenUsersByUserIdMap: oThis.tokenUser,
      userProfileAllowedActions: oThis.userProfileAllowedActions,
      imageMap: oThis.images,
      videoMap: oThis.videos,
      bio: oThis.bio,
      urlMap: oThis.links,
      tags: oThis.tags,
      userStat: oThis.userStat,
      videoDetailsMap: oThis.videoDetails,
      currentUserUserContributionsMap: oThis.currentUserUserContributionsMap,
      currentUserVideoContributionsMap: oThis.currentUserVideoContributionsMap
    };

    logger.log('The final response is : ', finalResponse);

    return responseHelper.successWithData(finalResponse);
  }

  /**
   * Fetch user.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchUser() {
    const oThis = this;

    const cacheRsp = await new UserMultiCache({ ids: [oThis.userId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.users = cacheRsp.data;

    const profileImageId = oThis.users[oThis.userId].profileImageId;

    if (profileImageId) {
      oThis.imageIdsArray.push(profileImageId);
    }
  }

  /**
   * Fetch token user.
   *
   * @sets oThis.tokenUser
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    logger.log('Fetching token user.');

    const tokenUserRes = await new TokenUserDetailByUserIdsCache({ userIds: [oThis.userId] }).fetch();

    if (tokenUserRes.isFailure()) {
      return Promise.reject(tokenUserRes);
    }

    oThis.tokenUser = tokenUserRes.data;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Get user profile allowed actions.
   *
   * @private
   */
  _getUserProfileAllowedActions() {
    const oThis = this;

    if (oThis.userId === oThis.currentUserId) {
      oThis.userProfileAllowedActions['editProfile'] = 1;
    } else {
      oThis.userProfileAllowedActions['editProfile'] = 0;
    }
  }

  /**
   * Fetch profile elements.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileElements() {
    const oThis = this;

    const cacheRsp = await new UserProfileElementsByUserIdCache({ usersIds: [oThis.userId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    let profileElements = cacheRsp.data[oThis.userId],
      updatedAt = 0;

    for (let kind in profileElements) {
      if (kind !== userProfileElementConst.linkIdKind && kind !== userProfileElementConst.bioIdKind) {
        oThis.userProfile[kind] = profileElements[kind].data;
      }

      if (updatedAt < profileElements[kind].updatedAt) {
        updatedAt = profileElements[kind].updatedAt;
      }

      await oThis._fetchElementData(kind, profileElements[kind].data);
    }

    oThis.userProfile['updatedAt'] = updatedAt;
  }

  /**
   * Fetch element data
   *
   * @param {string} kind - profile element kind
   * @param {number} data - profile element data
   * @return {Promise<void>}
   * @private
   */
  async _fetchElementData(kind, data) {
    const oThis = this;

    switch (kind) {
      case userProfileElementConst.coverImageIdKind:
        oThis.imageIdsArray.push(data);
        return;

      case userProfileElementConst.coverVideoIdKind:
        oThis.videoIdsArray.push(data);
        return;

      case userProfileElementConst.bioIdKind:
        return oThis._fetchBio(data);

      case userProfileElementConst.linkIdKind:
        return oThis._fetchLink(data);

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
  async _fetchBio(textId) {
    const oThis = this;

    let cacheRsp = await new TextByIdCache({ ids: [textId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.bio = {
      text: cacheRsp.data[textId].text
    };

    oThis.userProfile['bio'] = oThis.bio;

    let includes = {},
      tagIds = JSON.parse(cacheRsp.data[textId].tagIds);

    if (!tagIds) {
      return;
    }

    const tagCacheRsp = await oThis._fetchTags(tagIds),
      tagDetails = tagCacheRsp.data;

    for (let tagId in tagDetails) {
      let tagDetail = tagDetails[tagId],
        tagName = '#' + tagDetail.name;

      includes[tagName] = {
        kind: 'tags',
        id: tagDetail.id
      };
    }

    oThis.bio['includes'] = includes;
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
  async _fetchLink(linkId) {
    const oThis = this;

    let cacheRsp = await new UrlByIdCache({ ids: [linkId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.links[linkId] = cacheRsp.data[linkId];

    oThis.userProfile['linkIds'] = [linkId];
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
   * Fetch videos
   *
   * @return {Promise<never>}
   * @private
   */
  async _fetchVideo() {
    const oThis = this;

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
   * Set user profile.
   *
   * @private
   */
  _setUserProfile() {
    const oThis = this;

    oThis.userProfile = {
      id: oThis.userId,
      userId: oThis.userId,
      bio: null,
      linkIds: [],
      coverVideoId: null,
      coverImageId: null,
      updatedAt: null
    };
  }

  /**
   * Fetch user stats
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUserStats() {
    const oThis = this;

    const userStatByUserIdsCacheObj = new userStatByUserIdsCache({ userIds: [oThis.userId] }),
      cacheRsp = await userStatByUserIdsCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.userStat = cacheRsp.data;
  }

  /**
   * Fetch video details
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchVideoDetails() {
    const oThis = this;

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
        userIds: [oThis.userId]
      }
    ).fetch();

    if (userContributorByUserIdsAndContributedByUserIdCacheRsp.isFailure()) {
      return Promise.reject(userContributorByUserIdsAndContributedByUserIdCacheRsp);
    }

    oThis.currentUserUserContributionsMap = userContributorByUserIdsAndContributedByUserIdCacheRsp.data;
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
}

module.exports = GetUserProfile;
