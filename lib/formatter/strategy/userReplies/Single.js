const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for User Reply formatter.
 *
 * @class UserReplySingleFormatter
 */
class UserReplySingleFormatter extends BaseFormatter {
  /**
   * Constructor for user reply formatter.
   *
   * @param {object} params
   * @param {object} params.userReply
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userReply = params[entityTypeConstants.userReply];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const userReplyKeyConfig = {
      creatorUserId: { isNullAllowed: false },
      updatedAt: { isNullAllowed: true },
      replyDetailId: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.userReply, userReplyKeyConfig);
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
      id: 'ur_' + oThis.userReply.replyDetailId,
      kind: replyDetailConstants.userReplyKindForEntityFormatter,
      uts: oThis.userReply.updatedAt,
      payload: {
        reply_detail_id: oThis.userReply.replyDetailId,
        user_id: oThis.userReply.creatorUserId
      }
    });
  }
}

module.exports = UserReplySingleFormatter;
