const rootPrefix = '../../',
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  FeedByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/FeedByIds'),
  LoggedOutFeedCache = require(rootPrefix + '/lib/cacheManagement/single/LoggedOutFeed'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  userProfileElementConstants = require(rootPrefix + '/lib/globalConstant/userProfileElement');

// Declare variables.
const batchSize = 100;

/**
 * Class to delete videos of user.
 *
 * @class DeleteVideosOfUser
 */
class DeleteVideosOfUser {
  /**
   * Constructor to delete videos of user.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {array<number>} params.videoIds
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.videoIds = params.videoIds;
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

    const videoIdsLength = oThis.videoIds.length;
    if (videoIdsLength === 0) {
      return;
    }

    const promisesArray = [oThis._deleteProfileElement()];

    for (let index = 0; index < videoIdsLength; index += batchSize) {
      const tempArray = oThis.videoIds.slice(index, index + batchSize);
      promisesArray.push(
        oThis._markVideosDeleted(tempArray),
        oThis._markVideoDetailsDeleted(tempArray),
        oThis._deleteVideoFeeds(tempArray)
      );
    }

    await Promise.all(promisesArray);
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

    // Delete feeds.
    await new FeedModel()
      .delete()
      .where({
        kind: feedConstants.invertedKinds[feedConstants.fanUpdateKind],
        primary_external_entity_id: videoIds
      })
      .fire();

    // Clear cache.
    const promisesArray = [];
    promisesArray.push(new LoggedOutFeedCache().clear());
    promisesArray.push(new FeedByIdsCache({ ids: feedIds }));
    await Promise.all(promisesArray);
  }

  /**
   * Delete profile element.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteProfileElement() {
    const oThis = this;

    return new UserProfileElementModel().deleteByUserIdAndKind({
      userId: oThis.userId,
      dataKind: userProfileElementConstants.coverVideoIdKind
    });
  }
}

module.exports = DeleteVideosOfUser;
