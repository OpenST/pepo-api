const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  feedsConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail');

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

    oThis.userVideo = params[entityTypeConstants.userVideo];
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
      videoId: { isNullAllowed: false }
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

    let kind = feedsConstants.fanUpdateKind;

    let payload = {
      video_id: oThis.userVideo.videoId,
      user_id: oThis.userVideo.creatorUserId
    };

    if (oThis.userVideo.videoDetailId) {
      payload['video_detail_id'] = oThis.userVideo.videoDetailId;
    } else if (oThis.userVideo.replyDetailId) {
      payload['reply_detail_id'] = oThis.userVideo.replyDetailId;
      kind = replyDetailConstants.videoReplyKindForEntityFormatter;
    }

    return responseHelper.successWithData({
      id: 'v_' + oThis.userVideo.videoId,
      kind: kind,
      uts: oThis.userVideo.updatedAt,
      payload: payload
    });
  }
}

module.exports = UserVideoSingleFormatter;
