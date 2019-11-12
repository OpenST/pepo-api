const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ReplyDetailModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail');

/**
 * Class for reply video post transaction.
 *
 * @class ReplyVideoPostTransaction
 */
class ReplyVideoPostTransaction {
  /**
   * Constructor for reply video post transaction.
   *
   * @param {object} params
   * @param {string/number} params.replyDetailId
   * @param {string} params.transactionId
   * @param {string/number} params.videoId
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.replyDetailId = +params.replyDetailId;
    oThis.transactionId = params.transactionId;
    oThis.videoId = +params.videoId;

    oThis.isInValidTransaction = false;
    oThis.replyDetail = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<*>}
   */
  async perform() {
    const oThis = this;

    await oThis.fetchAndValidateReplyDetail();

    if (!oThis.isInValidTransaction) {
      const promisesArray = [oThis._updateReplyDetail(), oThis._updateTotalReplies()];
      await Promise.all(promisesArray);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Validate reply details.
   *
   * @sets oThis.replyDetail, oThis.isInValidTransaction
   *
   * @returns {Promise<*>}
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
      oThis.isInValidTransaction = true;

      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_t_rvpt_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { replyDetailId: oThis.replyDetailId }
      });

      return createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    }

    if (CommonValidators.isVarNullOrUndefined(oThis.videoId) || +oThis.replyDetail.parentId !== oThis.videoId) {
      oThis.isInValidTransaction = true;

      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_t_rvpt_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          replyDetailId: oThis.replyDetailId,
          videoId: oThis.videoId
        }
      });

      return createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    }
  }

  /**
   * Update reply details.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateReplyDetail() {
    const oThis = this;

    await new ReplyDetailModel()
      .update({
        transaction_id: oThis.transactionId,
        status: replyDetailConstants.invertedStatuses[replyDetailConstants.activeStatus]
      })
      .where({ id: oThis.replyDetailId })
      .fire();

    await ReplyDetailModel.flushCache({ videoId: oThis.replyDetail.parentId, replyDetailId: oThis.replyDetailId });
  }

  /**
   * Update total replies.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateTotalReplies() {
    const oThis = this;

    await new VideoDetailModel()
      .update('total_replies = total_replies + 1')
      .where({ video_id: oThis.replyDetail.parentId })
      .fire();

    await VideoDetailModel.flushCache({ userId: oThis.replyDetail.creatorUserId, videoId: oThis.replyDetail.parentId });
  }
}

module.exports = ReplyVideoPostTransaction;
