const rootPrefix = '../../..',
  TextByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  UrlByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  userStatByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserStatByUserIds'),
  TagByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
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
    oThis.imageIdsArray = [];
  }

  /**
   * Perform.
   *
   * @return {Promise<{}>}
   */
  async perform() {
    const oThis = this;

    oThis._setUserProfile();

    await oThis._fetchUser();

    await oThis._fetchTokenUser();

    oThis._getUserProfileAllowedActions();

    await oThis._fetchProfileElements();

    await oThis._fetchImage();

    await oThis._fetchUserStats();

    let a = {
      userProfileDetails: oThis.userProfile,
      usersByIdMap: oThis.users,
      tokenUsersByUserIdMap: oThis.tokenUser,
      userProfileAllowedActions: oThis.userProfileAllowedActions,
      imageMap: oThis.images,
      videoMap: oThis.videos,
      bio: oThis.bio,
      urlMap: oThis.links,
      tags: oThis.tags,
      userStat: oThis.userStat
    };

    console.log('The final response is : ', a);

    return responseHelper.successWithData({
      userProfileDetails: oThis.userProfile,
      usersByIdMap: oThis.users,
      tokenUsersByUserIdMap: oThis.tokenUser,
      userProfileAllowedActions: oThis.userProfileAllowedActions,
      imageMap: oThis.images,
      videoMap: oThis.videos,
      bio: oThis.bio,
      urlMap: oThis.links,
      tags: oThis.tags,
      userStat: oThis.userStat
    });
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
        return oThis._fetchCoverVideo(data);

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
   * Fetch cover video, cover image and poster image
   *
   * @param {number} videoId
   * @return {Promise<never>}
   * @private
   */
  async _fetchCoverVideo(videoId) {
    const oThis = this;

    let cacheRsp = await new VideoByIdCache({ ids: [videoId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    let video = cacheRsp.data[videoId],
      posterImageId = video.posterImageId;

    if (posterImageId) {
      oThis.imageIdsArray.push(posterImageId);
    }

    oThis.videos[videoId] = video;
  }

  async _fetchUserStats() {
    const oThis = this;

    const userStatByUserIdsCacheObj = new userStatByUserIdsCache({ userIds: [oThis.userId] }),
      cacheRsp = await userStatByUserIdsCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.userStat = cacheRsp.data;
  }
  // TODO: @santhosh - Functions for fetching contribution stats
}

module.exports = GetUserProfile;
