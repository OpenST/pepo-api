const rootPrefix = '../..',
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ReplyDetailModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for Reply Video Post Transaction.
 *
 * @class ReplyVideoPostTransaction
 */
class ReplyVideoPostTransaction {
  /**
   * Reply Video Post Transaction Constructor.
   *
   * @param params
   */
  constructor(params) {
    const oThis = this;

    oThis.replyDetailId = +params.replyDetailId;
    oThis.transactionId = params.transactionId;
    oThis.videoId = +params.videoId;

    oThis.replyDetail = null;
  }

  /**
   * Perform
   *
   * @returns {Promise<unknown>}
   */
  async perform() {
    const oThis = this;

    let replyDetailRsp = await oThis.fetchAndValidateReplyDetail();

    if (replyDetailRsp.isFailure()) {
      return replyDetailRsp;
    }

    await oThis._updateReplyDetail();

    await oThis._updateTotalReplies();

    return responseHelper.successWithData({});
  }

  /**
   * Get reply detail
   *
   * @returns {Promise<*|result>}
   */
  async fetchAndValidateReplyDetail() {
    const oThis = this;

    const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: [oThis.replyDetailId] }).fetch();

    if (replyDetailCacheResp.isFailure()) {
      logger.error('Error while fetching reply detail data.');

      return Promise.reject(replyDetailCacheResp);
    }

    oThis.replyDetail = replyDetailCacheResp.data[oThis.replyDetailId];

    if (!CommonValidators.validateNonEmptyObject(oThis.replyDetail)) {
      return responseHelper.error({
        internal_error_identifier: 'l_t_rvpt_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { replyDetailId: oThis.replyDetailId }
      });
    }

    if (CommonValidators.isVarNullOrUndefined(oThis.videoId) || oThis.replyDetail.parentId !== oThis.videoId) {
      return responseHelper.error({
        internal_error_identifier: 'l_t_rvpt_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          replyDetailId: oThis.replyDetailId,
          videoId: oThis.videoId
        }
      });
    }

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
      .where({ video_id: oThis.replyDetail.parentId })
      .fire();
  }
}

module.exports = ReplyVideoPostTransaction;
