const rootPrefix = '../../..',
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  VideoDeleteBase = require(rootPrefix + '/lib/video/delete/Base'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  DecrementWeightsAndRemoveVideoTags = require(rootPrefix + '/lib/video/DecrementWeightsAndRemoveVideoTags'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag');

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
   * Fetch and set video ids
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAndSetVideosIds() {
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
   * @returns {Promise<number>}
   * @private
   */
  async _fetchVideoIdsToBeDeleted() {
    const oThis = this;

    const dbRows = await new VideoDetailModel()
      .select('video_id')
      .where({ creator_user_id: oThis.userId })
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      oThis.videoIds.push(dbRows[index].video_id);
    }

    return oThis.videoIds.length;
  }

  /**
   * Decrement tag weight and remove video tag
   *
   * @param params
   * @returns {Promise<void>}
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
   * @return {Promise<*>}
   * @private
   */
  async _markDetailsDeleted(videoIds) {
    const oThis = this;

    return new VideoDetailModel().markDeleted({
      userId: oThis.userId,
      videoIds: videoIds
    });
  }

  /**
   * Perform specific activities
   *
   * @param videoIds
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
   * @return {Promise<*>}
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
        .where({
          id: feedIds
        })
        .fire();

      await FeedModel.flushCache({ ids: feedIds });
    }
  }

  /**
   * Delete the reply videos of the given video.
   *
   * @param videoIds
   * @returns {Promise<void>}
   * @private
   */
  async _deleteReplyVideos(videoIds) {
    const oThis = this;
  }
}

module.exports = UserVideos;
