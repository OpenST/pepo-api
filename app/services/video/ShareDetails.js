const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
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

    oThis.shareMessage = null;
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

    await oThis._fetchVideo();
    await oThis._fetchCreatorUserName();

    oThis._createMessage();

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

    //todo: deleted video or user check is missing
    const cacheRsp = await new VideoByIdCache({ ids: [oThis.videoId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    if (!commonValidator.validateNonEmptyObject(cacheRsp.data[oThis.videoId])) {
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

      //todo: deleted video or user check is missing
      if (userMultiCacheRsp.isFailure()) {
        return Promise.reject(userMultiCacheRsp);
      }

      let userDetails = userMultiCacheRsp.data[creatorUserId];

      oThis.creatorUserName = userDetails.name;
    }
  }

  /**
   * Create Message.
   *
   * @private
   */
  _createMessage() {
    const oThis = this;

    oThis.shareMessage = `🌶️ Checkout ${
      oThis.creatorUserName
    }'s latest video on Pepo! ${oThis._generateVideoShareUrl()}`;
  }
  /**
   * Prepare final response.
   *
   * @returns {Promise<*|result>}
   * @private
   */ _prepareResponse() {
    const oThis = this;

    return {
      [entityType.share]: Object.assign(
        {
          id: uuidV4(),
          kind: shareEntityConstants.videoShareKind,
          url: oThis._generateVideoShareUrl(),
          uts: Math.round(new Date() / 1000)
        },
        shareEntityConstants.getVideoShareEntity(oThis.creatorUserName, oThis._generateVideoShareUrl())
      )
    };
  }
  /**
   * Generate video share url.
   *
   * @returns {string}
   * @private
   */ _generateVideoShareUrl() {
    const oThis = this;

    return urlDomain + '/' + gotoConstants.videoShareGotoKind + '/' + oThis.videoId;
  }
}
module.exports = ShareDetails;
