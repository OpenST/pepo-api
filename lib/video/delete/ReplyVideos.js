const rootPrefix = '../../..',
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  VideoDeleteBase = require(rootPrefix + '/lib/video/delete/Base'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  DecrementWeightsAndRemoveVideoTags = require(rootPrefix + '/lib/video/DecrementWeightsAndRemoveVideoTags'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag');

/**
 * Class to delete videos of user.
 *
 * @class UserVideos
 */
class ReplyVideos extends VideoDeleteBase {
  /**
   * Constructor to delete reply videos.
   *
   * @param {object} params
   * @param {array<number>} params.replyDetailsIds
   *
   * @constructor
   */
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.replyDetailsIds = params.replyDetailsIds;
    oThis.videoIds = [];
  }

  /**
   * Fetch and set video ids.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAndSetVideosIds() {
    const oThis = this;

    let cacheResponse = await new ReplyDetailsByIdsCache({ ids: oThis.replyDetailsIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    for (let index = 0; index < oThis.replyDetailsIds.length; index++) {
      oThis.videoIds.push(cacheResponse.data[oThis.replyDetailsIds[index]].entityId);
    }
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
      kind: videoTagConstants.replyKind
    }).perform();
  }

  /**
   * Mark deleted status in reply details.
   *
   * @param {array<number>} videoIds
   *
   * @return {Promise<*>}
   * @private
   */
  async _markDetailsDeleted(videoIds) {
    const oThis = this;

    return new ReplyDetailsModel().markVideoEntitiesDeleted({
      videoIds: videoIds,
      replyDetailIds: oThis.replyDetailsIds //reply details ids is passed so that the cache will be cleared
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
    //Do Nothing
  }
}

module.exports = ReplyVideos;
