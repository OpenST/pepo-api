const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ReplyDetailModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob');

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
   * @param {string} [params.transactionId]
   * @param {string/number} params.videoId
   * @param {string/number} params.pepoAmountInWei
   * @param {array} [params.mentionedUserIds]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.replyDetailId = +params.replyDetailId;
    oThis.transactionId = params.transactionId;
    oThis.videoId = +params.videoId;
    oThis.pepoAmountInWei = params.pepoAmountInWei;
    oThis.mentionedUserIds = params.mentionedUserIds || [];

    oThis.videoDetails = {};
    oThis.isValidTransaction = false;
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

    const promisesArray = [oThis._updateReplyDetail()];

    if (oThis.isValidTransaction) {
      promisesArray.push(oThis._updateTotalReplies());
    }
    await Promise.all(promisesArray);

    await oThis._fetchVideoDetail();

    await oThis._enqueueNotification();

    return responseHelper.successWithData({});
  }

  /**
   * Validate reply details.
   *
   * @sets oThis.replyDetail, oThis.isValidTransaction
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
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_t_rvpt_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { replyDetailId: oThis.replyDetailId }
      });

      return createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    }

    if (CommonValidators.isVarNullOrUndefined(oThis.videoId) || +oThis.replyDetail.parentId !== oThis.videoId) {
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

    oThis.isValidTransaction = true;
  }

  /**
   * Update reply details.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateReplyDetail() {
    const oThis = this,
      updateParams = {};

    if (oThis.transactionId) {
      updateParams.transaction_id = oThis.transactionId;
    }

    if (oThis.isValidTransaction) {
      updateParams.status = replyDetailConstants.invertedStatuses[replyDetailConstants.activeStatus];
    }

    await new ReplyDetailModel()
      .update(updateParams)
      .where({ id: oThis.replyDetailId })
      .fire();

    await ReplyDetailModel.flushCache({
      parentVideoIds: [oThis.replyDetail.parentId],
      replyDetailId: oThis.replyDetailId,
      entityIds: [oThis.replyDetail.entityId],
      entityKind: oThis.replyDetail.entityKind
    });
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

  /**
   * Fetch video details.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchVideoDetail() {
    const oThis = this;

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({
      videoIds: [oThis.replyDetail.parentId]
    }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    oThis.videoDetails = videoDetailsCacheResponse.data[oThis.replyDetail.parentId];
  }

  /**
   * Enqueue notifications to required users according to transfer amount.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueNotification() {
    const oThis = this;

    // If pepoAmountInWei is zero, don't send the amount in notifications payload.
    if (oThis.pepoAmountInWei === '0') {
      // Notification would be published only if user is approved.
      await notificationJobEnqueue.enqueue(notificationJobConstants.replySenderWithoutAmount, {
        userId: oThis.replyDetail.creatorUserId,
        replyDetailId: oThis.replyDetail.id,
        videoOwnerUserId: oThis.videoDetails.creatorUserId,
        videoId: oThis.replyDetail.entityId
      });

      // Notification would be published only if user is approved.
      await notificationJobEnqueue.enqueue(notificationJobConstants.replyReceiverWithoutAmount, {
        userId: oThis.replyDetail.creatorUserId, // replier
        videoOwnerUserId: oThis.videoDetails.creatorUserId, // original video creator
        replyDetailId: oThis.replyDetail.id,
        videoId: oThis.replyDetail.entityId,
        mentionedUserIds: oThis.mentionedUserIds
      });
    } else {
      // Notification would be published only if user is approved.
      await notificationJobEnqueue.enqueue(notificationJobConstants.replySenderWithAmount, {
        userId: oThis.replyDetail.creatorUserId,
        replyDetailId: oThis.replyDetail.id,
        videoId: oThis.replyDetail.entityId,
        videoOwnerUserId: oThis.videoDetails.creatorUserId,
        amount: oThis.pepoAmountInWei
      });

      // Notification would be published only if user is approved.
      await notificationJobEnqueue.enqueue(notificationJobConstants.replyReceiverWithAmount, {
        userId: oThis.replyDetail.creatorUserId, // replier
        videoOwnerUserId: oThis.videoDetails.creatorUserId, // original video creator
        replyDetailId: oThis.replyDetail.id,
        videoId: oThis.replyDetail.entityId,
        amount: oThis.pepoAmountInWei,
        mentionedUserIds: oThis.mentionedUserIds
      });
    }
  }
}

module.exports = ReplyVideoPostTransaction;
