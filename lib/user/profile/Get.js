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
   * @param params.userId {String} - user id
   * @param params.currentUserId {object} - current user id
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

    await oThis._fetchUser();

    await oThis._fetchTokenUser();

    oThis._getUserProfileAllowedActions();

    await oThis._fetchProfileImage();

    await oThis._fetchProfileElements();

    await oThis._fetchImage(oThis.imageIdsArray);

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
   * Fetch user.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchUser() {
    const oThis = this;

    let userMultiCache = new UserMultiCache({ ids: [oThis.userId] });
    let cacheRsp = await userMultiCache.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }
    oThis.users = cacheRsp.data;

    oThis.userProfile['id'] = oThis.userId;
    oThis.userProfile['userId'] = oThis.userId;
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

  _getUserProfileAllowedActions() {
    const oThis = this;
    if (oThis.userId === oThis.currentUserId) {
      oThis.userProfileAllowedActions['editProfile'] = 1;
    } else {
      oThis.userProfileAllowedActions['editProfile'] = 0;
    }
  }

  /**
   * Fetch profile image
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileImage() {
    const oThis = this;

    let profileImageId = oThis.users[oThis.userId].profileImageId;

    if (!profileImageId) {
      return;
    }

    oThis.imageIdsArray.push(profileImageId);
  }

  /**
   * Fetch profile elements.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileElements() {
    const oThis = this;

    const userProfileElementsByUserIdCacheObj = new UserProfileElementsByUserIdCache({ usersIds: [oThis.userId] }),
      cacheRsp = await userProfileElementsByUserIdCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    let profileElements = cacheRsp.data[oThis.userId];
    let updatedAt = 0;
    for (let kind in profileElements) {
      if (updatedAt < profileElements[kind].updatedAt) {
        updatedAt = profileElements[kind].updatedAt;
      }

      if (kind !== userProfileElementConst.linkIdKind && kind !== userProfileElementConst.bioIdKind) {
        oThis.userProfile[kind] = profileElements[kind].data;
      }
      await oThis._fetchElementData(kind, profileElements[kind].data);
    }
    oThis.userProfile['updatedAt'] = updatedAt;
  }

  /**
   * Fetch element data
   *
   * @param kind - profile element kind
   * @param data - profile element data
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
   * @param textId
   * @return {Promise<never>}
   * @private
   */
  async _fetchBio(textId) {
    const oThis = this;

    let textByIdCacheObj = new TextByIdCache({ ids: [textId] });

    let cacheRsp = await textByIdCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.bio = {
      text: cacheRsp.data[textId].text
    };

    let tagIds = JSON.parse(cacheRsp.data[textId].tagIds);

    let tagCacheRsp = await oThis._fetchTags(tagIds);

    let includes = {};
    let tagDetails = tagCacheRsp.data;

    for (let tagId in tagDetails) {
      let tagDetail = tagDetails[tagId];
      let tagName = '#' + tagDetail.name;
      includes[tagName] = {
        kind: 'tags',
        id: tagDetail.id
      };
    }

    oThis.bio['includes'] = includes;

    oThis.userProfile['bio'] = oThis.bio;
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

    let tagByIdCacheObj = new TagByIdCache({ ids: tagIds });

    let cacheRsp = await tagByIdCacheObj.fetch();

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

    let urlByIdCacheObj = new UrlByIdCache({ ids: [linkId] });

    let cacheRsp = await urlByIdCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    if (oThis.userProfile.hasOwnProperty('linkIds')) {
      oThis.userProfile['linkIds'].push(linkId);
    } else {
      oThis.userProfile['linkIds'] = [linkId];
    }

    oThis.links[linkId] = cacheRsp.data[linkId];
  }

  /**
   * Fetch image
   *
   * @param imageId
   * @return {Promise<never>}
   * @private
   */
  async _fetchImage(imageIds) {
    const oThis = this;

    const imageByIdCacheObj = new ImageByIdCache({ ids: imageIds }),
      cacheRsp = await imageByIdCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.images = cacheRsp.data;
  }

  /**
   * Fetch cover video, cover image and poster image
   *
   * @param videoId
   * @return {Promise<never>}
   * @private
   */
  async _fetchCoverVideo(videoId) {
    const oThis = this;

    let videoByIdCacheObj = new VideoByIdCache({ ids: [videoId] });

    let cacheRsp = await videoByIdCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    let video = cacheRsp.data[videoId];

    oThis.videos[videoId] = video;
    let posterImageId = video.posterImageId;

    if (posterImageId) {
      oThis.imageIdsArray.push(posterImageId);
    }
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
