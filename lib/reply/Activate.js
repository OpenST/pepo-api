const rootPrefix = '../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  TextByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  UserActionDetailModel = require(rootPrefix + '/app/models/cassandra/UserActionDetail'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  IncrementWeightsAndAddVideoTags = require(rootPrefix + '/lib/video/IncrementWeightsAndAddVideoTags'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  VideoDistinctReplyCreatorsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDistinctReplyCreators'),
  DynamicVariablesByKindCache = require(rootPrefix + '/lib/cacheManagement/multi/DynamicVariablesByKind'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  videoDetailConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  dynamicVariableConstants = require(rootPrefix + '/lib/globalConstant/big/dynamicVariables'),
  userActionDetailConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userActionDetail');

/**
 * Class for reply video post transaction.
 *
 * @class ReplyVideoPostTransaction
 */
class ReplyVideoPostTransaction {
  /**
   * Constructor to make reply active.
   *
   * @param {object} params
   * @param {string/number} params.replyDetail
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.replyDetail = params.replyDetail;

    oThis.parentVideoDetail = {};
    oThis.videoDescription = null;
    oThis.tagIds = [];
    oThis.mentionedUserIds = [];
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<*>}
   */
  async perform() {
    const oThis = this;

    await oThis.validateReplyDetail();

    await oThis._fetchParentVideoDetail();

    await oThis._updateReplyDetail();

    const promisesArray = [];

    promisesArray.push(oThis._updateTotalReplies());

    promisesArray.push(oThis._fetchVideoDescription());

    promisesArray.push(oThis._populateFeedData());

    await Promise.all(promisesArray);

    if (oThis.replyDetail.descriptionId) {
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

    if (!oThis.replyDetail.descriptionId) {
      return;
    }
    const cacheResponse = await new TextByIdCache({ ids: [oThis.replyDetail.descriptionId] }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.videoDescription = cacheResponse.data[oThis.replyDetail.descriptionId].text;
  }

  /**
   * Populate feed data.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _populateFeedData() {
    const oThis = this;

    const lastReplyTimestamp = Date.now();

    const updateParams = {
      last_reply_timestamp: Math.floor(lastReplyTimestamp / 1000)
    };

    const dynamicThreshold = await oThis._dynamicPopularityThreshold();
    if (dynamicThreshold && oThis.parentVideoDetail.totalReplies + 1 >= dynamicThreshold) {
      updateParams.is_popular = 1;
    }

    const feedResp = await new FeedModel()
      .select('*')
      .where({
        primary_external_entity_id: oThis.parentVideoDetail.videoId,
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
      entityId: oThis.parentVideoDetail.videoId,
      updateParams: {
        lastReplyTimestamp: lastReplyTimestamp
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
    const filterTagsResp = await new FilterTags(oThis.videoDescription, oThis.replyDetail.descriptionId).perform(),
      videoDescriptionTagsData = filterTagsResp.data;

    oThis.tagIds = videoDescriptionTagsData.tagIds;
  }

  /**
   * Validate reply details.
   *
   *
   * @returns {Promise<*>}
   */
  async validateReplyDetail() {
    const oThis = this;

    if (
      !CommonValidators.validateNonEmptyObject(oThis.replyDetail) ||
      oThis.replyDetail.status !== replyDetailConstants.unppprovedStatus
    ) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_r_a_vrt_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { replyDetail: oThis.replyDetail }
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

    const replyDetailsResponse = await new ReplyDetailsModel()
      .update({
        status: replyDetailConstants.invertedStatuses[replyDetailConstants.activeStatus]
      })
      .where({
        status: replyDetailConstants.invertedStatuses[replyDetailConstants.unppprovedStatus],
        id: oThis.replyDetail.id
      })
      .fire();

    if (replyDetailsResponse.affectedRows === 0) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_r_a_urd_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { replyDetail: oThis.replyDetail }
        })
      );
    }

    await ReplyDetailsModel.flushCache({
      parentVideoIds: [oThis.replyDetail.parentId],
      replyDetailId: oThis.replyDetail.id,
      userIds: [oThis.replyDetail.creatorUserId],
      entityKind: replyDetailConstants.videoEntityKind,
      entityIds: oThis.replyDetail.entityId
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
      .where({ id: oThis.parentVideoDetail.id })
      .fire();

    await VideoDetailModel.flushCache({
      userId: oThis.parentVideoDetail.creatorUserId,
      videoId: oThis.parentVideoDetail.videoId
    });

    await new VideoDistinctReplyCreatorsCache({ videoIds: [oThis.parentVideoDetail.videoId] }).clear();
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

    oThis.parentVideoDetail = videoDetailsCacheResponse.data[oThis.replyDetail.parentId];

    if (oThis.parentVideoDetail.status !== videoDetailConstants.activeStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_r_a_fpvd_4',
          api_error_identifier: 'something_went_wrong',
          debug_options: { parentVideoDetails: oThis.parentVideoDetail }
        })
      );
    }
  }

  /** vbn
   * Enqueue notifications to required users accord`    ing to transfer amount.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueReplyNotification() {
    const oThis = this;

    //todo: get and pepoAmountInWei

    await oThis._fetchMentionedUsers();
    const pepoAmountInWei = 0;

    //todo: notification was not sent to mentionedUserIds as it was already sent. Validate flow
    await notificationJobEnqueue.enqueue(notificationJobConstants.replyNotificationsKind, {
      userId: oThis.replyDetail.creatorUserId, // Replier
      parentVideoOwnerUserId: oThis.parentVideoDetail.creatorUserId, // Original video creator
      replyDetailId: oThis.replyDetail.id,
      replyEntityId: oThis.replyDetail.entityId,
      parentVideoId: oThis.replyDetail.parentId,
      amount: pepoAmountInWei,
      mentionedUserIds: oThis.mentionedUserIds
    });
  }

  /**
   * Fetch mentioned users for given text/description.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchMentionedUsers() {
    const oThis = this;

    if (!oThis.replyDetail.descriptionId) {
      return;
    }

    const cacheRsp = await new TextIncludesByIdsCache({ ids: [oThis.replyDetail.descriptionId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    const textIncludes = cacheRsp.data;

    for (const textId in textIncludes) {
      const includesForAllKinds = textIncludes[textId];

      for (let ind = 0; ind < includesForAllKinds.length; ind++) {
        const includeRow = includesForAllKinds[ind],
          entity = includeRow.entityIdentifier.split('_');

        if (entity[0] === textIncludeConstants.userEntityKindShort) {
          oThis.mentionedUserIds.push(entity[1]);
        }
      }
    }
  }

  /**
   * Checks if the parent video is popular
   *
   * @returns {Promise<void>}
   * @private
   */
  async _dynamicPopularityThreshold() {
    const cacheResponse = await new DynamicVariablesByKindCache({
      kinds: [dynamicVariableConstants.numberOfRepliesPopularityThreshold]
    }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const popularityDynamicVariables = cacheResponse.data;

    if (popularityDynamicVariables[dynamicVariableConstants.numberOfRepliesPopularityThreshold].value) {
      return popularityDynamicVariables[dynamicVariableConstants.numberOfRepliesPopularityThreshold].value;
    }

    return null;
  }
}

module.exports = ReplyVideoPostTransaction;
