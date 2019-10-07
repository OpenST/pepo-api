const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TextByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  shareEntityConstants = require(rootPrefix + '/lib/globalConstant/shareEntity'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  commonValidator = require(rootPrefix + '/lib/validators/Common'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType');

const urlDomain = coreConstants.PA_DOMAIN;

class ShareDetails extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoId = params.video_id;
    oThis.currentUser = params.current_user;

    oThis.isSelfVideoShare = false;
    oThis.messageObject = null;
    oThis.creatorName = null;
    oThis.twitterHandle = null;
    oThis.videoDescriptionText = null;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchVideo();

    await oThis._fetchCreatorUserName();

    oThis.messageObject = shareEntityConstants.getVideoShareEntity({
      creatorName: oThis.creatorName,
      url: oThis._generateVideoShareUrl(),
      videoDescription: oThis.videoDescriptionText,
      handle: oThis.twitterHandle,
      isSelfVideoShare: oThis.isSelfVideoShare
    });

    return responseHelper.successWithData(oThis._prepareResponse());
  }

  /**
   * Fetch video.
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
      !commonValidator.validateNonEmptyObject(cacheRsp.data[oThis.videoId]) ||
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
  }

  /**
   * Fetch video creator user name.
   *
   * @returns {Promise<never>}
   *
   * @sets oThis.creatorName
   * @private
   */
  async _fetchCreatorUserName() {
    const oThis = this;

    const videoDetailsCacheRsp = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();

    if (videoDetailsCacheRsp.isFailure()) {
      return Promise.reject(videoDetailsCacheRsp);
    }

    let videoDetails = videoDetailsCacheRsp.data[oThis.videoId];

    if (videoDetails.descriptionId) {
      const textCacheResp = await new TextByIdCache({ ids: [videoDetails.descriptionId] }).fetch();

      if (textCacheResp.isFailure()) {
        return Promise.reject(textCacheResp);
      }

      let videoDescription = textCacheResp.data[videoDetails.descriptionId];

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

    let creatorUserId = videoDetails.creatorUserId;

    let userObj = {};

    // Video is of current user, so no need for query
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

    if (!userObj || userObj.status !== userConstants.activeStatus || !UserModel.isUserApprovedCreator(userObj)) {
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
   * @returns {Promise<never>}
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
   * @returns {Promise<*|result>}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    return {
      [entityType.share]: Object.assign(
        {
          id: uuidV4(),
          kind: shareEntityConstants.videoShareKind,
          uts: Math.round(new Date() / 1000)
        },
        oThis.messageObject
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

    return urlDomain + '/' + gotoConstants.videoGotoKind + '/' + oThis.videoId;
  }
}

module.exports = ShareDetails;
