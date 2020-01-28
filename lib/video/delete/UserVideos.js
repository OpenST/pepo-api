const rootPrefix = '../../..',
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  ChannelTagVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTagVideo'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  VideoDeleteBase = require(rootPrefix + '/lib/video/delete/Base'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  DeleteReplyVideos = require(rootPrefix + '/lib/video/delete/ReplyVideos'),
  ChannelVideoIdsByChannelIdPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/ChannelVideoIdsByChannelIdPagination'),
  DecrementWeightsAndRemoveVideoTags = require(rootPrefix + '/lib/video/DecrementWeightsAndRemoveVideoTags'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  webhookPreProcessorJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/webhookPreProcessor'),
  webhookPreProcessorJobConstants = require(rootPrefix + '/lib/globalConstant/webhookPreProcessorJob'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail');

const batchSize = 100;

/**
 * Class to delete videos of user.
 *
 * @class UserVideos
 */
class UserVideos extends VideoDeleteBase {
  /**
   * Constructor to delete videos of user.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.currentAdminId
   * @param {Boolean} params.isUserCreator
   * @param {array<number>} [params.videoIds]
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.isUserCreator = params.isUserCreator || false;
    oThis.videoIds = params.videoIds || [];

    oThis.entityKeys = [];
  }

  /**
   * Async perform.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchAndSetIds();

    const videoIdsLength = oThis.videoIds.length;

    if (videoIdsLength === 0) {
      return responseHelper.successWithData({});
    }

    // Perform operations in batches.
    for (let index = 0; index < videoIdsLength; index += batchSize) {
      const videoIdsBatch = oThis.videoIds.slice(index, index + batchSize);

      await oThis._markVideoDetailsDeleted(videoIdsBatch);
      await oThis._performOperations(videoIdsBatch);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch and set video ids.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAndSetIds() {
    const oThis = this;

    if (oThis.videoIds.length === 0) {
      await oThis._fetchVideoIdsToBeDeleted();
    }
  }

  /**
   * Fetch video ids to be deleted.
   *
   * @sets oThis.videoIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideoIdsToBeDeleted() {
    const oThis = this;

    const dbRows = await new VideoDetailModel()
      .select('video_id')
      .where({ creator_user_id: oThis.userId })
      .where({ status: videoDetailsConstants.invertedStatuses[videoDetailsConstants.activeStatus] })
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      oThis.videoIds.push(dbRows[index].video_id);
    }
  }

  /**
   * Decrement tag weight and remove video tag.
   *
   * @param {object} params
   * @param {array<number>} params.tagIds
   * @param {number} params.videoId
   *
   * @returns {Promise<*>}
   * @private
   */
  async _decrementTagWeightAndRemoveVideoTag(params) {
    await new DecrementWeightsAndRemoveVideoTags({
      tagIds: params.tagIds,
      videoId: params.videoId,
      kind: videoTagConstants.postKind
    }).perform();
  }

  /**
   * Mark deleted status in video details.
   *
   * @param {array<number>} videoIds
   *
   * @returns {Promise<*>}
   * @private
   */
  async _markVideoDetailsDeleted(videoIds) {
    const oThis = this;

    return new VideoDetailModel().markDeleted({
      userId: oThis.userId,
      videoIds: videoIds
    });
  }

  /**
   * Perform specific activities.
   *
   * @param {array<number>} videoIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performSpecificActivities(videoIds) {
    const oThis = this;

    const promises = [
      oThis._deleteVideoFeeds(videoIds),
      oThis._deleteReplyVideos(videoIds),
      oThis._enqueueWebhookPreprocessor(videoIds),
      oThis._deleteVideosFromChannels(videoIds)
    ];

    await Promise.all(promises);
  }

  /**
   * Enqueue for Webhook Preprocessor.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueWebhookPreprocessor(videoIds) {
    const oThis = this;

    if (oThis.isUserCreator) {
      const promises = [];
      for (let i = 0; i < videoIds.length; i++) {
        const videoId = videoIds[i],
          promise = webhookPreProcessorJobEnqueue.enqueue(webhookPreProcessorJobConstants.videoUpdateTopic, {
            videoId: videoId,
            oldTagIds: oThis.oldTagIdsMap[videoId]
          });

        promises.push(promise);
      }
      await Promise.all(promises);
    }
  }

  /**
   * Delete videos from channels.
   *
   * @param {array<number>} videoIds
   *
   * @returns {Promise<*>}
   * @private
   */
  async _deleteVideosFromChannels(videoIds) {
    const oThis = this;
    const promises = [];

    for (let i = 0; i < videoIds.length; i++) {
      promises.push(oThis._deleteVideoFromChannels(videoIds[i]));
    }

    await Promise.all(promises);
  }

  /**
   * Delete video from channels.
   *
   * @param {array<number>} videoId
   *
   * @returns {Promise<*>}
   * @private
   */
  async _deleteVideoFromChannels(videoId) {
    const oThis = this;

    let limit = 50,
      offset = 0;

    while (true) {
      const dbRows = await new ChannelVideoModel()
        .select(['channel_id', 'id'])
        .where({
          video_id: videoId
        })
        .where(['status not in (?)', channelVideosConstants.invertedStatuses[channelVideosConstants.inactiveStatus]])
        .order_by('id asc')
        .limit(limit)
        .offset(offset)
        .fire();

      if (dbRows.length === 0) {
        return;
      }

      const channelIds = [],
        channelVideoIds = [];

      for (let i = 0; i < dbRows.length; i++) {
        const dbRow = dbRows[i];
        channelIds.push(dbRow.channel_id);
        channelVideoIds.push(dbRow.id);
      }

      const cacheFlushPromises = [];

      await new ChannelTagVideoModel()
        .delete()
        .where({ video_id: videoId, channel_id: channelIds })
        .fire();

      //todo:channels modify cache flush as per usage
      const cachePromise1 = ChannelTagVideoModel.flushCache({
        videoId: videoId,
        channelIds: channelIds,
        tagIds: oThis.oldTagIdsMap[videoId]
      });

      cacheFlushPromises.push(cachePromise1);

      await new ChannelVideoModel()
        .update({ status: channelVideosConstants.invertedStatuses[channelVideosConstants.inactiveStatus] })
        .where({ id: channelVideoIds })
        .fire();

      for (let i = 0; i < channelIds.length; i++) {
        const promise = new ChannelVideoIdsByChannelIdPaginationCache({ channelId: channelIds[i] }).clear();
        cacheFlushPromises.push(promise);
      }

      await new ChannelStatModel()
        .update('total_videos = total_videos - 1')
        .where({ channel_id: channelIds })
        .fire();

      const cachePromise2 = ChannelStatModel.flushCache({ channelIds: channelIds });
      cacheFlushPromises.push(cachePromise2);

      await Promise.all(cacheFlushPromises);

      offset = offset + limit;
    }
  }

  /**
   * Delete video from feeds.
   *
   * @param {array<number>} videoIds
   *
   * @returns {Promise<*>}
   * @private
   */
  async _deleteVideoFeeds(videoIds) {
    // Fetch feed ids.
    const dbRows = await new FeedModel()
      .select('id')
      .where({
        kind: feedConstants.invertedKinds[feedConstants.fanUpdateKind],
        primary_external_entity_id: videoIds
      })
      .fire();

    const feedIds = [];
    for (let index = 0; index < dbRows.length; index++) {
      feedIds.push(dbRows[index].id);
    }

    if (feedIds.length > 0) {
      await new FeedModel()
        .delete()
        .where({ id: feedIds })
        .fire();

      await FeedModel.flushCache({ ids: feedIds });
    }
  }

  /**
   * Delete the reply videos of the given video.
   *
   * @param {array<number>} videoIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteReplyVideos(videoIds) {
    const replyDetailsIds = [];

    // Not checking for status as the delete reply videos lib checks for status.
    const dbRows = await new ReplyDetailsModel()
      .select(['id'])
      .where([
        'parent_id IN (?) AND parent_kind = ?',
        videoIds,
        replyDetailConstants.invertedEntityKinds[replyDetailConstants.videoEntityKind]
      ])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      replyDetailsIds.push(dbRows[index].id);
    }

    if (replyDetailsIds.length > 0) {
      // Making it as a user action true so that admin activity is not logged again.
      await new DeleteReplyVideos({ replyDetailsIds: replyDetailsIds, isUserAction: true }).perform();
    }
  }
}

module.exports = UserVideos;
