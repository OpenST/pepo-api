const rootPrefix = '../../',
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs');

// Declare variables.
const batchSize = 100;

/**
 * Class to delete videos of user.
 *
 * @class DeleteUserVideos
 */
class DeleteUserVideos {
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
    const oThis = this;

    console.log('==params=====', params);

    oThis.userId = params.userId;
    oThis.currentAdminId = params.currentAdminId;
    oThis.videoIds = params.videoIds || [];
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._asyncPerform();
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    const videoIdsLength =
      oThis.videoIds.length === 0 ? await oThis._fetchVideoIdsToBeDeleted() : oThis.videoIds.length;

    if (videoIdsLength === 0) {
      return responseHelper.successWithData({});
    }

    const promisesArray = [];

    // Perform operations in batches.
    for (let index = 0; index < videoIdsLength; index += batchSize) {
      const tempArray = oThis.videoIds.slice(index, index + batchSize);
      promisesArray.push(
        oThis._markVideosDeleted(tempArray),
        oThis._markVideoDetailsDeleted(tempArray),
        oThis._deleteVideoFeeds(tempArray),
        oThis._logAdminActivity(tempArray)
      );
    }

    await Promise.all(promisesArray);

    return responseHelper.successWithData({});
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
   * Mark deleted status in videos.
   *
   * @param {array<number>} videoIds
   *
   * @return {Promise<*>}
   * @private
   */
  async _markVideosDeleted(videoIds) {
    return new VideoModel().markVideosDeleted({ ids: videoIds });
  }

  /**
   * Mark deleted status in video details.
   *
   * @param {array<number>} videoIds
   *
   * @return {Promise<*>}
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
   * Log admin activity.
   *
   * @param {array<number>} videoIds
   *
   * @return {Promise<void>}
   * @private
   */
  async _logAdminActivity(videoIds) {
    const oThis = this;

    await new AdminActivityLogModel().insertAction({
      adminId: oThis.currentAdminId,
      actionOn: oThis.userId,
      action: adminActivityLogConstants.deleteUserVideos,
      extraData: JSON.stringify({ vids: videoIds })
    });
  }
}

module.exports = DeleteUserVideos;
