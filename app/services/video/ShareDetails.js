const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  TextsByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  shareEntityConstants = require(rootPrefix + '/lib/globalConstant/shareEntity'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail');

/**
 * Class to share video details.
 *
 * @class ShareDetails
 */
class ShareDetails extends ServiceBase {
  /**
   * Constructor to share video details.
   *
   * @param {object} params
   * @param {number} params.video_id
   * @param {object} params.current_user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoId = params.video_id;
    oThis.currentUser = params.current_user;

    oThis.isSelfVideoShare = false;
    oThis.creatorName = null;
    oThis.twitterHandle = null;
    oThis.videoDescriptionText = null;
    oThis.posterImageId = null;
    oThis.posterImageUrl = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchVideo();

    await oThis._fetchPosterImageUrl();

    await oThis._fetchCreatorUserName();

    return responseHelper.successWithData(oThis._prepareResponse());
  }

  /**
   * Fetch video.
   *
   * @sets oThis.posterImageId
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchVideo() {
    const oThis = this;

    const cacheRsp = await new VideoByIdCache({ ids: [oThis.videoId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    if (
      !CommonValidators.validateNonEmptyObject(cacheRsp.data[oThis.videoId]) ||
      cacheRsp.data[oThis.videoId].status === videoConstants.deletedStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_v_sd_1',
          api_error_identifier: 'entity_not_found',
          debug_options: { inputVideoId: oThis.videoId }
        })
      );
    }

    if (cacheRsp.data[oThis.videoId].posterImageId) {
      oThis.posterImageId = cacheRsp.data[oThis.videoId].posterImageId;
    }
  }

  /**
   * Fetch poster image url.
   *
   * @sets oThis.posterImageUrl
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchPosterImageUrl() {
    const oThis = this;

    if (!oThis.posterImageId) {
      return;
    }

    const cacheRsp = await new ImageByIdCache({ ids: [oThis.posterImageId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.posterImageUrl = cacheRsp.data[oThis.posterImageId].resolutions.original.url;
  }

  /**
   * Fetch video creator user name.
   *
   * @sets oThis.videoDescriptionText, oThis.isSelfVideoShare, oThis.creatorName
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchCreatorUserName() {
    const oThis = this;

    const videoDetailsCacheRsp = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();

    if (videoDetailsCacheRsp.isFailure()) {
      return Promise.reject(videoDetailsCacheRsp);
    }

    const videoDetails = videoDetailsCacheRsp.data[oThis.videoId];

    if (videoDetails.descriptionId) {
      const textCacheResp = await new TextsByIdCache({ ids: [videoDetails.descriptionId] }).fetch();
      if (textCacheResp.isFailure()) {
        return Promise.reject(textCacheResp);
      }

      const videoDescription = textCacheResp.data[videoDetails.descriptionId];

      if (videoDescription && videoDescription.text) {
        oThis.videoDescriptionText = videoDescription.text;
      }
    }

    // Already deleted.
    if (!videoDetails.creatorUserId || videoDetails.status === videoDetailsConstants.deletedStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_v_sd_2',
          api_error_identifier: 'entity_not_found'
        })
      );
    }

    const creatorUserId = videoDetails.creatorUserId;

    let userObj = {};

    // Video is of current user, so no need for query.
    if (oThis.currentUser && creatorUserId === oThis.currentUser.id) {
      userObj = oThis.currentUser;
      oThis.isSelfVideoShare = true;
    } else {
      const userMultiCacheRsp = await new UserMultiCache({ ids: [creatorUserId] }).fetch();

      if (userMultiCacheRsp.isFailure()) {
        return Promise.reject(userMultiCacheRsp);
      }

      userObj = userMultiCacheRsp.data[creatorUserId];
    }

    if (!userObj || userObj.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_v_sd_3',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            creatorUserId: creatorUserId
          }
        })
      );
    }

    oThis.creatorName = userObj.name;
    await oThis._fetchTwitterHandle(userObj.id);
  }

  /**
   * Fetch twitter handle.
   *
   * @sets oThis.twitterHandle
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchTwitterHandle(userId) {
    const oThis = this;

    const twitterUserByUserIdsCacheResponse = await new TwitterUserByUserIdsCache({
      userIds: [userId]
    }).fetch();

    if (twitterUserByUserIdsCacheResponse.isFailure()) {
      return Promise.reject(twitterUserByUserIdsCacheResponse);
    }

    const twitterUserByUserIdsCacheData = twitterUserByUserIdsCacheResponse.data[userId];

    if (!twitterUserByUserIdsCacheData || !twitterUserByUserIdsCacheData.id) {
      return; // Don't set oThis.twitterHandle, this returns share entity without 'twitterHandle'
    }

    const twitterUserId = twitterUserByUserIdsCacheData.id;

    const twitterUserByUserIdCacheResponse = await new TwitterUserByIdsCache({ ids: [twitterUserId] }).fetch();
    if (twitterUserByUserIdCacheResponse.isFailure()) {
      return Promise.reject(twitterUserByUserIdCacheResponse);
    }

    oThis.twitterHandle = twitterUserByUserIdCacheResponse.data[twitterUserId].handle;
  }

  /**
   * Prepare final response.
   *
   * @returns {{}}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    const messageObject = shareEntityConstants.getVideoShareEntity({
      creatorName: oThis.creatorName,
      url: oThis._generateVideoShareUrl(),
      videoDescription: oThis.videoDescriptionText,
      handle: oThis.twitterHandle,
      isSelfVideoShare: oThis.isSelfVideoShare
    });

    return {
      [entityTypeConstants.share]: Object.assign(
        {
          id: uuidV4(),
          kind: shareEntityConstants.videoShareKind,
          posterImageUrl: oThis.posterImageUrl,
          uts: Math.round(new Date() / 1000)
        },
        messageObject
      )
    };
  }

  /**
   * Generate video share url.
   *
   * @returns {string}
   * @private
   */
  _generateVideoShareUrl() {
    const oThis = this;

    return (
      coreConstants.PA_DOMAIN +
      '/' +
      gotoConstants.videoGotoKind +
      '/' +
      oThis.videoId +
      `?utm_source=share&utm_medium=video&utm_campaign=${oThis.videoId}`
    );
  }
}

module.exports = ShareDetails;
