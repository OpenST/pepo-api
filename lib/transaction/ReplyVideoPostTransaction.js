const BigNumber = require('bignumber.js');

const rootPrefix = '../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  AddReplyToGraphLib = require(rootPrefix + '/lib/video/AddReplyToGraph'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  TextByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  UserActionDetailModel = require(rootPrefix + '/app/models/cassandra/UserActionDetail'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  IncrementWeightsAndAddVideoTags = require(rootPrefix + '/lib/video/IncrementWeightsAndAddVideoTags'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  VideoDistinctReplyCreatorsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDistinctReplyCreators'),
  DynamicVariablesByKindCache = require(rootPrefix + '/lib/cacheManagement/multi/DynamicVariablesByKind'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  videoDetailConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  dynamicVariableConstants = require(rootPrefix + '/lib/globalConstant/dynamicVariables'),
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
    oThis.replyThreadFollowerUserIds = [];

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

    promisesArray.push(oThis._updateReplyInGraph());

    promisesArray.push(oThis._updateTotalReplies());

    promisesArray.push(oThis._clearDistinctReplyCreatorsCache());

    promisesArray.push(oThis._fetchVideoDescription());

    promisesArray.push(oThis._populateFeedData());

    await Promise.all(promisesArray);

    if (oThis.descriptionId) {
      await oThis._filterTags();

      await oThis._incrementTagWeights();
    }

    await oThis._enqueueReplyNotification();

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

    let dynamicThreshold = await oThis._dynamicPopularityThreshold();
    if (dynamicThreshold && oThis.parentVideoDetails.totalReplies + 1 >= dynamicThreshold) {
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
   * Update social Graph db.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateReplyInGraph() {
    const oThis = this;

    const params = {
      creatorUserId: oThis.replyDetail.creatorUserId,
      parentVideoId: oThis.parentVideoId,
      createdAt: Math.round(new Date() / 1000)
    };

    await new AddReplyToGraphLib(params).perform();
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
   * Enqueue notifications to required users according to transfer amount.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueReplyNotification() {
    const oThis = this;

    // Notification would be published only if user is approved.
    await notificationJobEnqueue.enqueue(notificationJobConstants.replyNotificationsKind, {
      userId: oThis.replyDetail.creatorUserId, // Replier
      parentVideoOwnerUserId: oThis.parentVideoDetails.creatorUserId, // Original video creator
      replyDetailId: oThis.replyDetail.id,
      replyEntityId: oThis.replyDetail.entityId,
      parentVideoId: oThis.replyDetail.parentId,
      amount: oThis.pepoAmountInWei,
      mentionedUserIds: oThis.mentionedUserIds
    });
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

  /**
   * Checks if the parent video is popular
   *
   * @returns {Promise<void>}
   * @private
   */
  async _dynamicPopularityThreshold() {
    const oThis = this;

    let cacheResponse = await new DynamicVariablesByKindCache({
      kinds: [dynamicVariableConstants.numberOfRepliesPopularityThreshold]
    }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    let popularityDynamicVariables = cacheResponse.data;

    if (popularityDynamicVariables[dynamicVariableConstants.numberOfRepliesPopularityThreshold].value) {
      return popularityDynamicVariables[dynamicVariableConstants.numberOfRepliesPopularityThreshold].value;
    } else {
      return null;
    }
  }
}

module.exports = ReplyVideoPostTransaction;
