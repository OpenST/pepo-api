const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserVideoViewModel = require(rootPrefix + '/app/models/cassandra/UserVideoView'),
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
  async _setUserVideoViewInCassandra() {
    const oThis = this;
    const params = {
      lastViewAt: Date.now(),
      userId: oThis.userId,
      videoIds: [oThis.videoId]
    };

    //if present in reply detail, then populate for parent.
    await new UserVideoViewModel().updateLastViewAtForVideos(params);

    logger.win(`Received video_play_start PepoMobileEvent with video id: ${oThis.videoId}`);
  }
}

module.exports = VideoPlayStart;
