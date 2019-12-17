const BigNumber = require('bignumber.js');

const rootPrefix = '../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  TextByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  UserActionDetailModel = require(rootPrefix + '/app/models/cassandra/UserActionDetail'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  IncrementWeightsAndAddVideoTags = require(rootPrefix + '/lib/video/IncrementWeightsAndAddVideoTags'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  VideoDistinctReplyCreatorsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDistinctReplyCreators'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  videoDetailConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  userActionDetailConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userActionDetail');

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
   * @param {string/number} params.currentUserId
   * @param {array} [params.mentionedUserIds]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.replyDetailId = +params.replyDetailId;
    oThis.parentVideoId = +params.videoId;
    oThis.transactionId = params.transactionId || null;
    oThis.pepoAmountInWei = params.pepoAmountInWei;
    oThis.currentUserId = params.currentUserId;
    oThis.mentionedUserIds = params.mentionedUserIds || [];

    oThis.parentVideoDetails = {};
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

    if (!oThis.isValidTransaction) {
      return responseHelper.successWithData({});
    }

    await oThis._fetchParentVideoDetail();

    const updateReplyDetailResp = await oThis._updateReplyDetail();

    //This is to check in case 2 parallel requests are fired.
    if (updateReplyDetailResp.affectedRows === 0) {
      return responseHelper.successWithData({});
    }

    const promisesArray = [];

    promisesArray.push(oThis._updateTotalReplies());

    promisesArray.push(oThis._clearDistinctReplyCreatorsCache());

    promisesArray.push(oThis._fetchVideoDescription());

    promisesArray.push(oThis._populateFeedData());

    await Promise.all(promisesArray);

    if (oThis.descriptionId) {
      await oThis._filterTags();

      await oThis._incrementTagWeights();
    }

    const promiseArray2 = [oThis._publishAtMentionNotifications(), oThis._enqueueReplyNotification()];

    await Promise.all(promiseArray2);

    return responseHelper.successWithData({});
  }

  /**
   * Fetch video description
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideoDescription() {
    const oThis = this;

    if (!oThis.descriptionId) {
      return;
    }
    let cacheResponse = await new TextByIdCache({ ids: [oThis.descriptionId] }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.videoDescription = cacheResponse.data[oThis.descriptionId].text;
  }

  /**
   * Populate feed data.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _populateFeedData() {
    const oThis = this;

    oThis.lastReplyTimestamp = Date.now();

    const updateParams = {
      last_reply_timestamp: Math.floor(oThis.lastReplyTimestamp / 1000)
    };

    if (
      new BigNumber(oThis.parentVideoDetails.totalAmount).gte(
        new BigNumber(videoDetailConstants.minPepoAmountForPopularVideo)
      )
    ) {
      updateParams['is_popular'] = 1;
    }

    const feedResp = await new FeedModel()
      .select('*')
      .where({
        primary_external_entity_id: oThis.parentVideoId,
        kind: feedConstants.invertedKinds[feedConstants.fanUpdateKind]
      })
      .fire();

    if (feedResp[0] && feedResp[0].id) {
      const feedId = feedResp[0].id;

      const updateResp = await new FeedModel()
        .update(updateParams)
        .where({ id: feedId })
        .fire();

      if (updateResp.affectedRows > 0) {
        await FeedModel.flushCache({ ids: [feedId] });
      }
    }

    const updateParamsForUserAction = {
      userId: oThis.currentUserId,
      entityKind: userActionDetailConstants.videoEntityKind,
      entityId: oThis.parentVideoId,
      updateParams: {
        lastReplyTimestamp: oThis.lastReplyTimestamp
      }
    };

    await new UserActionDetailModel().updateRow(updateParamsForUserAction);
  }

  /**
   * Filter tags.
   *
   * @sets oThis.tagIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _filterTags() {
    const oThis = this;

    // Filter out tags from video description.
    const filterTagsResp = await new FilterTags(oThis.videoDescription, oThis.descriptionId).perform(),
      videoDescriptionTagsData = filterTagsResp.data;

    oThis.tagIds = videoDescriptionTagsData.tagIds;
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

    // This is done intentionally.
    // Even if multiple requests come for same transaction, we won't work for it multiple times.
    if (oThis.replyDetail.status !== replyDetailConstants.pendingStatus) {
      oThis.isValidTransaction = false;
      return;
    }

    if (
      CommonValidators.isVarNullOrUndefined(oThis.parentVideoId) ||
      +oThis.replyDetail.parentId !== +oThis.parentVideoId
    ) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_t_rvpt_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          replyDetailId: oThis.replyDetailId,
          parentVideoId: oThis.parentVideoId
        }
      });

      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return Promise.reject(errorObject);
    }

    oThis.descriptionId = oThis.replyDetail.descriptionId;

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
      updateParams = {
        status: replyDetailConstants.invertedStatuses[replyDetailConstants.activeStatus]
      };

    if (oThis.transactionId) {
      updateParams.transaction_id = oThis.transactionId;
      oThis.replyDetail.transactionId = oThis.transactionId;
    }

    const replyDetailsResponse = await new ReplyDetailsModel()
      .update(updateParams)
      .where({
        status: replyDetailConstants.invertedStatuses[replyDetailConstants.pendingStatus],
        id: oThis.replyDetailId
      })
      .fire();

    if (replyDetailsResponse.affectedRows === 0) {
      return replyDetailsResponse;
    }

    oThis.replyDetail.status = replyDetailConstants.activeStatus;

    await ReplyDetailsModel.flushCache({
      parentVideoIds: [oThis.replyDetail.parentId],
      replyDetailId: oThis.replyDetailId
    });

    return replyDetailsResponse;
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
   * Increment tags weights.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _incrementTagWeights() {
    const oThis = this;

    await new IncrementWeightsAndAddVideoTags({
      tagIds: oThis.tagIds,
      videoId: oThis.replyDetail.entityId,
      kind: videoTagConstants.replyKind
    }).perform();
  }

  /**
   * Fetch video details.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchParentVideoDetail() {
    const oThis = this;

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({
      videoIds: [oThis.replyDetail.parentId]
    }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    oThis.parentVideoDetails = videoDetailsCacheResponse.data[oThis.replyDetail.parentId];

    if (oThis.parentVideoDetails.status !== videoDetailConstants.activeStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_t_rvpt_4',
          api_error_identifier: 'something_went_wrong',
          debug_options: { parentVideoDetails: oThis.parentVideoDetails }
        })
      );
    }
  }

  /**
   * Publish notifications
   * @returns {Promise<void>}
   * @private
   */
  async _publishAtMentionNotifications() {
    const oThis = this;

    if (oThis.mentionedUserIds.length === 0) {
      return;
    }

    await notificationJobEnqueue.enqueue(notificationJobConstants.replyUserMention, {
      userId: oThis.currentUserId,
      replyDetailId: oThis.replyDetailId,
      videoId: oThis.replyDetail.entityId, // replied video
      mentionedUserIds: oThis.mentionedUserIds,
      parentVideoOwnerUserId: oThis.parentVideoDetails.creatorUserId,
      parentVideoId: oThis.replyDetail.parentId
    });
  }

  /**
   * Enqueue notifications to required users according to transfer amount.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueReplyNotification() {
    const oThis = this;

    // If pepoAmountInWei is zero, don't send the amount in notifications payload.
    if (oThis.pepoAmountInWei == '0') {
      if (oThis.replyDetail.creatorUserId != oThis.parentVideoDetails.creatorUserId) {
        // Notification would be published only if user is approved.
        await notificationJobEnqueue.enqueue(notificationJobConstants.replySenderWithoutAmount, {
          userId: oThis.replyDetail.creatorUserId,
          replyDetailId: oThis.replyDetail.id,
          parentVideoOwnerUserId: oThis.parentVideoDetails.creatorUserId,
          videoId: oThis.replyDetail.entityId,
          parentVideoId: oThis.replyDetail.parentId
        });

        // Notification would be published only if user is approved.
        await notificationJobEnqueue.enqueue(notificationJobConstants.replyReceiverWithoutAmount, {
          userId: oThis.replyDetail.creatorUserId, // Replier
          parentVideoOwnerUserId: oThis.parentVideoDetails.creatorUserId, // Original video creator
          replyDetailId: oThis.replyDetail.id,
          videoId: oThis.replyDetail.entityId,
          mentionedUserIds: oThis.mentionedUserIds,
          parentVideoId: oThis.replyDetail.parentId
        });
      }
    } else {
      // Notification would be published only if user is approved.
      await notificationJobEnqueue.enqueue(notificationJobConstants.replySenderWithAmount, {
        userId: oThis.replyDetail.creatorUserId,
        replyDetailId: oThis.replyDetail.id,
        videoId: oThis.replyDetail.entityId,
        parentVideoOwnerUserId: oThis.parentVideoDetails.creatorUserId,
        amount: oThis.pepoAmountInWei,
        parentVideoId: oThis.replyDetail.parentId
      });

      // Notification would be published only if user is approved.
      await notificationJobEnqueue.enqueue(notificationJobConstants.replyReceiverWithAmount, {
        userId: oThis.replyDetail.creatorUserId, // Replier
        parentVideoOwnerUserId: oThis.parentVideoDetails.creatorUserId, // Original video creator
        replyDetailId: oThis.replyDetail.id,
        videoId: oThis.replyDetail.entityId,
        amount: oThis.pepoAmountInWei,
        mentionedUserIds: oThis.mentionedUserIds,
        parentVideoId: oThis.replyDetail.parentId
      });
    }
  }

  /**
   * Clear Distinct reply creators cache
   *
   * @returns {Promise<void>}
   * @private
   */
  async _clearDistinctReplyCreatorsCache() {
    const oThis = this;

    const cacheResp = await new VideoDistinctReplyCreatorsCache({ videoIds: [oThis.replyDetail.parentId] }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    const videoCreatorsMap = cacheResp.data;
    // If map is not empty then look for reply creator in that list
    if (!CommonValidators.validateNonEmptyObject(videoCreatorsMap[oThis.replyDetail.parentId])) {
      const replyCreators = videoCreatorsMap[oThis.replyDetail.parentId];
      // If reply creators is present and creator is already in it, then don't delete cache
      if (replyCreators[oThis.replyDetail.creatorUserId]) {
        return responseHelper.successWithData({});
      }
    }

    await new VideoDistinctReplyCreatorsCache({ videoIds: [oThis.replyDetail.parentId] }).clear();
  }
}

module.exports = ReplyVideoPostTransaction;
