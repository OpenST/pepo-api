const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Video Reply formatter.
 *
 * @class VideoReplySingleFormatter
 */
class VideoReplySingleFormatter extends BaseFormatter {
  /**
   * Constructor for video reply formatter.
   *
   * @param {object} params
   * @param {object} params.videoReply
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoReply = params[entityType.videoReply];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const videoReplyKeyConfig = {
      id: { isNullAllowed: false },
      userId: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false },
      replyDetailId: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.videoReply, videoReplyKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: 'r_' + oThis.videoReply.replyDetailId,
      kind: replyDetailConstants.videoEntityKind,
      uts: oThis.videoReply.updatedAt,
      payload: {
        video_id: oThis.videoReply.replyDetailId,
        user_id: oThis.videoReply.userId
      }
    });
  }
}

module.exports = VideoReplySingleFormatter;
