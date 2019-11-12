const rootPrefix = '../..',
  ReplyDetailModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Update Reply Video Post Transaction.
 *
 * @class UpdateReplyVideoPostTransaction
 */
class UpdateReplyVideoPostTransaction {
  /**
   * Update Reply Video Post Transaction Constructor.
   *
   * @param params
   */
  constructor(params) {
    const oThis = this;

    oThis.replyDetailId = +params.replyDetailId;
    oThis.transactionId = params.transactionId;
    oThis.videoId = params.videoId;

    oThis.replyDetail = null;
  }

  /**
   * Perform
   *
   * @returns {Promise<unknown>}
   */
  async perform() {
    const oThis = this;

    await oThis._updateReplyDetail();

    await oThis._updateTotalReplies();

    return responseHelper.successWithData({});
  }

  /**
   * Update reply details
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateReplyDetail() {
    const oThis = this;

    await ReplyDetailModel()
      .update({
        transaction_id: oThis.transactionId,
        status: replyDetailConstants.invertedStatuses[replyDetailConstants.activeStatus]
      })
      .where({ id: oThis.replyDetailId })
      .fire();
  }

  /**
   * Update total replies
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateTotalReplies() {
    const oThis = this;

    await VideoDetailModel()
      .update('total_replies = total_replies + 1')
      .where({ video_id: oThis.videoId })
      .fire();
  }
}

module.exports = UpdateReplyVideoPostTransaction;
