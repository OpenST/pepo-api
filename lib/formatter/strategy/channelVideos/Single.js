const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos');

/**
 * Class for channel videos single formatter.
 *
 * @class ChannelVideosSingleFormatter
 */
class ChannelVideosSingleFormatter extends BaseFormatter {
  /**
   * Constructor for channel videos single formatter.
   *
   * @param {object} params
   * @param {object} params.channelVideo
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelVideo = params[entityTypeConstants.channelVideo];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const userVideoKeyConfig = {
      creatorUserId: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false },
      videoId: { isNullAllowed: false },
      videoDetailId: { isNullAllowed: false },
      isPinned: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.channelVideo, userVideoKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    const payload = {
      user_id: oThis.channelVideo.creatorUserId,
      video_id: oThis.channelVideo.videoId,
      video_detail_id: oThis.channelVideo.videoDetailId,
      is_pinned: oThis.channelVideo.isPinned
    };

    return responseHelper.successWithData({
      id: 'v_' + oThis.channelVideo.videoId,
      kind: channelVideosConstants.channelVideoResponseEntityKind,
      uts: oThis.channelVideo.updatedAt,
      payload: payload
    });
  }
}

module.exports = ChannelVideosSingleFormatter;
