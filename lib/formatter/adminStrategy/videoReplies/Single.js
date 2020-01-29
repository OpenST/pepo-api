const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Video Reply formatter.
 *
 * @class AdminVideoReplySingleFormatter
 */
class AdminVideoReplySingleFormatter extends BaseFormatter {
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

    oThis.videoReply = params[entityTypeConstants.videoReply];
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
      creatorUserId: { isNullAllowed: false },
      updatedAt: { isNullAllowed: true },
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
      kind: replyDetailConstants.videoReplyKindForEntityFormatter,
      uts: oThis.videoReply.updatedAt,
      payload: {
        reply_detail_id: oThis.videoReply.replyDetailId,
        user_id: oThis.videoReply.creatorUserId
      }
    });
  }
}

module.exports = AdminVideoReplySingleFormatter;
