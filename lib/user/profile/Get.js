const rootPrefix = '../..',
  TextByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  UrlByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
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
  }

  /**
   *
   */
  async perform() {
    const oThis = this;

    await oThis._fetchProfileElements();
  }

  /**
   * Fetch profile elements
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileElements() {
    const oThis = this;

    let profileInfo = {};

    let userProfileElementsByUserIdCacheObj = new UserProfileElementsByUserIdCache({ userIds: [oThis.userId] });

    let cacheRsp = await userProfileElementsByUserIdCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    let profileElements = cacheRsp.data[oThis.userId];

    for (let kind in profileElements) {
      let elementData = await oThis._fetchElementData(kind, profileElements[kind]);

      let elementInfo = {
        [kind]: elementData
      };

      Object.assign(profileInfo, elementInfo);
    }
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
      case userProfileElementConst.coverImageKind:
        return oThis._fetchCoverImage(data);
      case userProfileElementConst.coverVideoKind:
        return oThis._fetchCoverVideo(data);
      case userProfileElementConst.bioKind:
        return oThis._fetchBio(data);
      case userProfileElementConst.urlKind:
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

    return cacheRsp.data[textId];
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

    return cacheRsp.data[linkId];
  }

  /**
   * Fetch cover image
   *
   * @param imageId
   * @return {Promise<never>}
   * @private
   */
  async _fetchCoverImage(imageId) {
    const oThis = this;

    let imageByIdCacheObj = new ImageByIdCache({ ids: [imageId] });

    let cacheRsp = await imageByIdCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    return cacheRsp.data[imageId];
  }

  /**
   * Fetch cover video
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

    return cacheRsp.data[videoId];
  }

  // TODO: Functions for fetching contribution stats
}

module.exports = GetUserProfile;
