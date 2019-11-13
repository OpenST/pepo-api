const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  feedsConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for User Video formatter.
 *
 * @class UserVideoSingleFormatter
 */
class UserVideoSingleFormatter extends BaseFormatter {
  /**
   * Constructor for user video formatter.
   *
   * @param {object} params
   * @param {object} params.userVideo
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userVideo = params[entityType.userVideo];
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
      id: { isNullAllowed: false },
      creatorUserId: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false },
      videoId: { isNullAllowed: false },
      videoDetailId: { isNullAllowed: true },
      replyDetailId: { isNullAllowed: true }
    };

    return oThis.validateParameters(oThis.userVideo, userVideoKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    let payload = {
      video_id: oThis.userVideo.videoId,
      user_id: oThis.userVideo.creatorUserId
    };
    if (oThis.userVideo.videoDetailId) {
      payload['videoDetailId'] = oThis.userVideo.videoDetailId;
    } else if (oThis.userVideo.replyDetailId) {
      payload['replyDetailId'] = oThis.userVideo.replyDetailId;
    }
    return responseHelper.successWithData({
      id: 'v_' + oThis.userVideo.videoId,
      kind: feedsConstants.fanUpdateKind,
      uts: oThis.userVideo.updatedAt,
      payload: payload
    });
  }
}

module.exports = UserVideoSingleFormatter;
