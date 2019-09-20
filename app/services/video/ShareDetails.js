const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
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

    oThis.messageObject = null;
    oThis.creatorUserName = null;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    //if this is a curated video,
    if (oThis.videoId < 0) {
      oThis.messageObject = shareEntityConstants.getVideoShareEntityForCuratedVideos(oThis._generateVideoShareUrl());
    } else {
      oThis.messageObject = shareEntityConstants.getVideoShareEntity(
        oThis.creatorUserName,
        oThis._generateVideoShareUrl()
      );
      await oThis._fetchVideo();
      await oThis._fetchCreatorUserName();
    }

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
   * @sets oThis.creatorUserName
   * @private
   */
  async _fetchCreatorUserName() {
    const oThis = this;

    const videoDetailsCacheRsp = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();

    if (videoDetailsCacheRsp.isFailure()) {
      return Promise.reject(videoDetailsCacheRsp);
    }

    let videoDetails = videoDetailsCacheRsp.data[oThis.videoId];

    // Already deleted.
    if (!videoDetails.creatorUserId || videoDetails.status === videoDetailsConstants.deletedStatus) {
      responseHelper.paramValidationError({
        internal_error_identifier: 'a_s_v_sd_2',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['invalid_video_id'],
        debug_options: { videoDetails: videoDetails }
      });
    }

    let creatorUserId = videoDetails.creatorUserId;

    // Video is of current user, so no need for query
    if (creatorUserId === oThis.currentUser.id) {
      oThis.creatorUserName = oThis.currentUser.name;
    } else {
      const userMultiCacheRsp = await new UserMultiCache({ ids: [creatorUserId] }).fetch();

      if (userMultiCacheRsp.isFailure()) {
        return Promise.reject(userMultiCacheRsp);
      }

      let userDetails = userMultiCacheRsp.data[creatorUserId];

      if (
        !userDetails ||
        userDetails.status !== userConstants.activeStatus ||
        !UserModel.isUserApprovedCreator(userDetails)
      ) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_v_sd_3',
            api_error_identifier: 'invalid_api_params',
            params_error_identifiers: ['user_not_active'],
            debug_options: {
              creatorUserId: creatorUserId
            }
          })
        );
      }

      oThis.creatorUserName = userDetails.name;
    }
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

    return urlDomain + '/' + gotoConstants.videoShareGotoKind + '/' + oThis.videoId;
  }
}
module.exports = ShareDetails;
