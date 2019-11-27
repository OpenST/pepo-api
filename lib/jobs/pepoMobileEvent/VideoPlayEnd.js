const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Constructor for VideoPlayEnd.
 *
 * @class VideoPlayEnd
 */
class VideoPlayEnd {
  /**
   * Constructor for VideoPlayEnd.
   *
   * @augments VideoPlayEnd
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;
    logger.log('VideoPlayEnd===========', params);

    let message = params.message;

    oThis.videoId = (message.payload || {})['video_id'];
    oThis.userId = params.socketUserId;

    oThis.feedObj = null;
  }

  /**
   * Async performer.
   *
   * @returns {Promise<void>}
   * @private
   */
  async perform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.feedObj
   *
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (
      !CommonValidators.validateNonZeroInteger(oThis.videoId) ||
      !CommonValidators.validateNonZeroInteger(oThis.userId)
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_j_pb_vpe_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { videoId: oThis.videoId, userId: oThis.userId }
        })
      );
    }

    const videoByIdCacheRsp = await new VideoByIdCache({ ids: [oThis.videoId] }).fetch();
    if (videoByIdCacheRsp.isFailure()) {
      return Promise.reject(videoByIdCacheRsp);
    }

    if (
      !CommonValidators.validateNonEmptyObject(videoByIdCacheRsp.data[oThis.videoId]) ||
      videoByIdCacheRsp.data[oThis.videoId].status === videoConstants.deletedStatus
    ) {
      logger.error('Video does not exists in table => video id:', oThis.videoId);
    } else {
      logger.win(
        `Received video_play_end PepoMobileEvent for ${videoByIdCacheRsp.data[oThis.videoId].kind} with video id: ${
          oThis.videoId
        }`
      );
    }
  }
}

module.exports = VideoPlayEnd;
