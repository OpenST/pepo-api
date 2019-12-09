const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserVideoViewModel = require(rootPrefix + '/app/models/cassandra/UserVideoView'),
  ReplyDetailsByEntityIdsAndEntityKindCache = require(rootPrefix +
    '/lib/cacheManagement/multi/ReplyDetailsByEntityIdsAndEntityKind'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Constructor for VideoPlayStart.
 *
 * @class VideoPlayStart
 */
class VideoPlayStart {
  /**
   * Constructor for VideoPlayStart.
   *
   * @augments VideoPlayStart
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;
    logger.log('VideoPlayStart===========', params);

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

    await oThis._setParentVideoIdForReply();

    let promises = [];

    promises.push(oThis._setUserVideoViewInCassandra());

    await Promise.all(promises);

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
          internal_error_identifier: 'l_j_pb_fvv_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { videoId: oThis.videoId, userId: oThis.userId }
        })
      );
    }
  }

  /**
   * Insert/update User video view .
   *
   * @returns {Promise<*>}
   * @private
   */
  async _setParentVideoIdForReply() {
    const oThis = this;

    const replyDetailsByEntityIdsAndEntityKindCacheRsp = await new ReplyDetailsByEntityIdsAndEntityKindCache({
      entityIds: [oThis.videoId],
      entityKind: replyDetailConstants.videoEntityKind
    }).fetch();

    if (replyDetailsByEntityIdsAndEntityKindCacheRsp.isFailure()) {
      logger.error('Error while fetching reply detail data.');

      return Promise.reject(replyDetailsByEntityIdsAndEntityKindCacheRsp);
    }

    const replyDetailId = replyDetailsByEntityIdsAndEntityKindCacheRsp.data[oThis.videoId].id;

    if (replyDetailId) {
      const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: [replyDetailId] }).fetch();
      if (replyDetailCacheResp.isFailure()) {
        logger.error('Error while fetching reply detail data.');

        return Promise.reject(replyDetailCacheResp);
      }

      const replyDetail = replyDetailCacheResp.data[replyDetailId];

      if (CommonValidators.validateNonEmptyObject(replyDetail)) {
        oThis.parentVideoId = replyDetail.parentId;
      }
    }
  }

  /**
   * Insert/update User video view .
   *
   * @returns {Promise<*>}
   * @private
   */
  async _setUserVideoViewInCassandra() {
    const oThis = this;
    const params1 = {
      lastViewAt: Date.now(),
      userId: oThis.userId,
      videoIds: [oThis.videoId]
    };

    const promiseArray = [];
    promiseArray.push(new UserVideoViewModel().updateLastViewAtForVideos(params1));

    if (oThis.parentVideoId) {
      logger.win(`Received video_play_start PepoMobileEvent for parent video id: ${oThis.parentVideoId}`);
      const params2 = {
        lastReplyViewAt: Date.now(),
        userId: oThis.userId,
        parentVideoIds: [oThis.parentVideoId]
      };
      promiseArray.push(new UserVideoViewModel().updateLastReplyViewAtForParentVideos(params2));
    }

    await Promise.all(promiseArray);

    logger.win(`Received video_play_start PepoMobileEvent with video id: ${oThis.videoId}`);
  }
}

module.exports = VideoPlayStart;
