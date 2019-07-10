const rootPrefix = '../../..',
  TextByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  UrlByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
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
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;

    oThis.userProfile = {};
    oThis.users = {};
    oThis.images = {};
    oThis.videos = {};
    oThis.bio = null;
    oThis.links = {};
    oThis.posterImageId = null;
  }

  /**
   * Perform.
   *
   * @return {Promise<{}>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchUser();

    await oThis._fetchProfileImage();

    await oThis._fetchProfileElements();

    await oThis._fetchPosterImage();

    return responseHelper.successWithData({
      userProfileDetails: oThis.userProfile,
      usersByIdMap: oThis.users,
      imageMap: oThis.images,
      videoMap: oThis.videos,
      bio: oThis.bio,
      links: oThis.links
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

    console.log('_fetchUser cacheRsp ========', cacheRsp);

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }
    oThis.users = cacheRsp.data;

    oThis.userProfile['userId'] = oThis.userId;
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

    await oThis._fetchImage(profileImageId);
  }

  /**
   * Fetch profile elements.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileElements() {
    const oThis = this;

    oThis.userProfile = {};

    const userProfileElementsByUserIdCacheObj = new UserProfileElementsByUserIdCache({ usersIds: [oThis.userId] }),
      cacheRsp = await userProfileElementsByUserIdCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    let profileElements = cacheRsp.data[oThis.userId];

    for (let kind in profileElements) {
      oThis.userProfile[kind] = profileElements[kind];
      await oThis._fetchElementData(kind, profileElements[kind].data);
    }
  }

  /**
   * Fetch poster image
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchPosterImage() {
    const oThis = this;

    if (!oThis.posterImageId) {
      return;
    }

    await oThis._fetchImage(oThis.posterImageId);
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
      case userProfileElementConst.profileImageIdKind:
      case userProfileElementConst.coverImageIdKind:
        return oThis._fetchImage(data);
      case userProfileElementConst.coverVideoIdKind:
        return oThis._fetchCoverVideoAndImage(data);
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

    oThis.bio = cacheRsp.data[textId].text;
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
  async _fetchImage(imageId) {
    const oThis = this;

    const imageByIdCacheObj = new ImageByIdCache({ ids: [imageId] }),
      cacheRsp = await imageByIdCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.images[imageId] = cacheRsp.data[imageId];
  }

  /**
   * Fetch cover video and poster image
   *
   * @param videoId
   * @return {Promise<never>}
   * @private
   */
  async _fetchCoverVideoAndImage(videoId) {
    const oThis = this;

    let videoByIdCacheObj = new VideoByIdCache({ ids: [videoId] });

    let cacheRsp = await videoByIdCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    let video = cacheRsp.data[videoId];

    oThis.videos[videoId] = video;
    oThis.posterImageId = video.posterImageId;
  }

  // TODO: @santhosh - Functions for fetching contribution stats
}

module.exports = GetUserProfile;
