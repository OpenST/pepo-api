const rootPrefix = '../../..',
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  VideoDeleteBase = require(rootPrefix + '/lib/video/delete/Base'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  DeleteReplyVideos = require(rootPrefix + '/lib/video/delete/ReplyVideos'),
  DecrementWeightsAndRemoveVideoTags = require(rootPrefix + '/lib/video/DecrementWeightsAndRemoveVideoTags'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
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
   * @param {array<number>} [params.videoIds]
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

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

    await oThis._deleteVideoFeeds(videoIds);

    await oThis._deleteReplyVideos(videoIds);
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

    const dbRows = await new ReplyDetailsModel()
      .select(['id'])
      .where(['parent_id IN (?)', videoIds])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      replyDetailsIds.push(dbRows[index].id);
    }

    if (replyDetailsIds.length > 0) {
      // Making it as a user action true so that admin activity is not logged again.
      await new DeleteReplyVideos({ replyDetailsIds: replyDetailsIds, isUserAction: true }).perform();

      await ReplyDetailsModel.flushCache({
        replyDetailIds: replyDetailsIds,
        parentVideoIds: videoIds
      });
    }
  }
}

module.exports = UserVideos;
